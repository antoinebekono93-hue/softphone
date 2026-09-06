"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from "react";
import { useSession } from "next-auth/react";
import Pusher from "pusher-js";
import { toast } from "sonner";
import { appCallChannels, APP_CALL_EVENTS } from "@/lib/app-call-channels";
import {
  isPolitePair,
  decideIncomingOffer,
  decideIceCandidate,
  canApplyRemoteDescription,
  canMakeOffer,
  canAttemptIceRestart,
  decideIceFailure,
  ICE_RESTART_MAX_ATTEMPTS,
} from "@/lib/webrtc-negotiation";
import {
  classifyGetUserMediaError,
  mediaFailReason,
  mediaErrorMessage,
  shouldAddTrack,
  setAudioTracksEnabled,
  decideRemoteAudio,
  MediaErrorKind,
} from "@/lib/webrtc-media";
import { PUBLIC_STUN_FALLBACK } from "@/lib/ice-config";

/**
 * AppCallContext — Appels APP_TO_APP (WebRTC natif P2P, hors Telnyx/PSTN).
 *
 * Signaling via Pusher (canaux privés) :
 *  - private-user-{userId}  : sonnerie entrante + évènements d'état.
 *  - private-call-{callId}  : échange signal SDP / ICE entre les 2 participants.
 *
 * APP_TO_APP n'est jamais facturé au wallet (commercialement illimité si
 * unlimitedCalls). La durée est bornée par maxCallDurationSeconds (fair-use).
 */

type AppCallStatus =
  | "idle"
  | "OFFERING"
  | "RINGING"
  | "CONNECTING"
  | "ACTIVE"
  | "ENDED"
  | "MISSED"
  | "DECLINED"
  | "FAILED";

interface SignalMessage {
  type: "CALL_READY" | "CALL_OFFER" | "CALL_ANSWER" | "ICE_CANDIDATE";
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}

// Signal complet tel que publié par le SERVEUR sur le canal d'appel (M2).
interface ServerCallSignal {
  type: SignalMessage["type"];
  sessionId: string;
  senderId: string;
  toId: string;
  timestamp: number;
  payload: SignalMessage;
}

interface AppCallContextValue {
  // État
  appCallStatus: AppCallStatus;
  incomingAppCall: {
    callId: string;
    callerId: string;
    callerName: string | null;
    callerUsername: string | null;
    callerExtension: string | null;
  } | null;
  outboundPeer: { name: string | null; username: string | null } | null;
  remoteStream: MediaStream | null;
  audioPlayFailed: boolean;
  retryRemoteAudio: () => void;
  appCallDuration: number;
  connected: boolean;
  error: string | null;
  directory: Array<{ id: string; name: string | null; callUsername: string | null; callExtension: string | null; email: string | null }>;
  // Actions
  makeAppCall: (target: string) => Promise<void>;
  acceptAppCall: () => Promise<void>;
  declineAppCall: () => Promise<void>;
  hangupAppCall: () => void;
  muteAppMic: (muted: boolean) => void;
  refreshDirectory: () => Promise<void>;
}

const AppCallContext = createContext<AppCallContextValue | null>(null);

function rtcConfiguration(): RTCConfiguration {
  // Fallback minimal : STUN public (liste UNIQUE définie dans lib/ice-config,
  // partagée avec la route /api/app-calls/ice-config). La configuration
  // TURN réelle est servie par le serveur — jamais dans le bundle frontend.
  return {
    iceServers: PUBLIC_STUN_FALLBACK,
  };
}

/**
 * Log structuré WebRTC — diagnostics production-safe.
 * Ne log JAMAIS : TURN credentials, SDP, tokens, candidates en clair.
 */
function logIce(
  callId: string | null,
  role: "caller" | "callee",
  event: string,
  details?: Record<string, unknown>
) {
  const ts = new Date().toISOString();
  const base = `[WebRTC][ICE] ${ts} callId=${callId ?? "?"} role=${role} event=${event}`;
  if (details) {
    console.log(base, JSON.stringify(details));
  } else {
    console.log(base);
  }
}

/**
 * Log structuré MÉDIA/AUDIO — diagnostics production-safe.
 * Ne log JAMAIS : données audio, SDP, tokens, credentials.
 * Inclut uniquement callId, role, event, timestamp et infos techniques minimes.
 */
function logMedia(
  callId: string | null,
  role: "caller" | "callee",
  event: string,
  details?: Record<string, unknown>
) {
  const ts = new Date().toISOString();
  const base = `[WebRTC][MEDIA] ${ts} callId=${callId ?? "?"} role=${role} event=${event}`;
  if (details) {
    console.log(base, JSON.stringify(details));
  } else {
    console.log(base);
  }
}

/**
 * Log structuré du CYCLE DE VIE d'appel (timeline d'état) — production-safe.
 * Même format que logIce/logMedia ; séparé pour permettre un grepproperty
 * `event=call*` (OFFERING → RINGING → ACCEPTING → CONNECTED → terminal).
 * Ne log JAMAIS de secret (SDP, tokens, credentials).
 */
function logCallState(
  callId: string | null,
  role: "caller" | "callee",
  event: string,
  details?: Record<string, unknown>
) {
  const ts = new Date().toISOString();
  const base = `[WebRTC][STATE] ${ts} callId=${callId ?? "?"} role=${role} event=${event}`;
  if (details) {
    console.log(base, JSON.stringify(details));
  } else {
    console.log(base);
  }
}

export function AppCallProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? null;

  const [appCallStatus, setAppCallStatus] = useState<AppCallStatus>("idle");
  const [incomingAppCall, setIncomingAppCall] = useState<AppCallContextValue["incomingAppCall"]>(null);
  const [outboundPeer, setOutboundPeer] = useState<AppCallContextValue["outboundPeer"]>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [appCallDuration, setAppCallDuration] = useState(0);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioPlayFailed, setAudioPlayFailed] = useState(false);
  const [directory, setDirectory] = useState<AppCallContextValue["directory"]>([]);

  const pusherRef = useRef<Pusher | null>(null);
  const callChannelRef = useRef<any>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  // Référence STABLE du flux distant : indépendante de l'état React.
  // On évite de dépendre uniquement de la state pour des objets MediaStream.
  const remoteStreamRef = useRef<MediaStream | null>(null);
  // Élément audio distant stable (un seul par cycle de vie d'appel).
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  // Garde anti-concurrence : un seul getUserMedia en vol à la fois.
  const getUserMediaInProgressRef = useRef(false);
  const activeCallIdRef = useRef<string | null>(null);
  // Rôle du participant pour l'appel actif (référence stable pour les logs
  // hors du scope de setupPeerAndChannel : retryRemoteAudio, finishCall, mute).
  const activeCallRoleRef = useRef<"caller" | "callee" | null>(null);
  const maxDurationRef = useRef<number>(3600);
  const micMutedRef = useRef(false);
  const peerReadyRef = useRef(false);
  // M5 : file d'attente des candidats ICE reçus AVANT que la description distante
  // soit posée (setRemoteDescription). On les applique dès que possible.
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  // M10 : configuration ICE mise en cache (chargée une fois par session auth).
  const iceConfigRef = useRef<RTCConfiguration | null>(null);
  // ── Perfect Negotiation (refs) ────────────────────────────────────────────
  // `polite` est DÉTERMINISTE par session (basé sur les IDs, identiques des deux
  // côtés) : jamais un état local qui pourrait diverger entre les navigateurs.
  const politeRef = useRef<boolean>(false);
  const peerUserIdRef = useRef<string | null>(null);
  // Garde anti-collision : une offre en cours de création/emission à la fois.
  const makingOfferRef = useRef(false);
  // Lors d'une collision, l'impolite doit ignorer l'offre pendant son rollback.
  const ignoreOfferRef = useRef(false);
  // Une réponse distante est en cours d'application (pour décider d'un rollback).
  const isSettingRemoteAnswerPendingRef = useRef(false);
  // Nombre de tentatives de restart ICE (borné par ICE_RESTART_MAX_ATTEMPTS).
  const iceRestartCountRef = useRef(0);
  // Garde anti-concurrence : un seul restart en vol à la fois.
  const iceRestartInProgressRef = useRef(false);

  // ── Réinitialisation complète de l'état APP_TO_APP (M6) ──────
  const resetCall = useCallback(() => {
    setAppCallStatus("idle");
    setIncomingAppCall(null);
    setOutboundPeer(null);
    setRemoteStream(null);
    setConnected(false);
    setError(null);
    setAudioPlayFailed(false);
    setAppCallDuration(0);
    activeCallIdRef.current = null;
    activeCallRoleRef.current = null;
    peerReadyRef.current = false;
    pendingCandidatesRef.current = [];
    peerUserIdRef.current = null;
    politeRef.current = false;
      makingOfferRef.current = false;
    ignoreOfferRef.current = false;
    isSettingRemoteAnswerPendingRef.current = false;
    iceRestartCountRef.current = 0;
    iceRestartInProgressRef.current = false;

    if (callChannelRef.current) {
      try {
        callChannelRef.current.unbind_all();
        callChannelRef.current = null;
      } catch {
        callChannelRef.current = null;
      }
    }
    if (pcRef.current) {
      const pc = pcRef.current;
      try {
        pc.onicecandidate = null;
        pc.onicecandidateerror = null;
        pc.ontrack = null;
        pc.onconnectionstatechange = null;
        pc.oniceconnectionstatechange = null;
        pc.onsignalingstatechange = null;
        pc.onicegatheringstatechange = null;
        pc.onnegotiationneeded = null;
        pc.close();
      } catch {
        // ignore
      }
      pcRef.current = null;
    }
    // Arrête TOUTES les pistes locales (audio) pour libérer le micro.
    try {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    } catch {
      // ignore
    }
    localStreamRef.current = null;
    // Arrête les pistes distantes / détache l'audio distant pour ne plus
    // jouer d'audio après une session terminale (privacy).
    try {
      remoteStreamRef.current?.getTracks().forEach((t) => t.stop());
    } catch {
      // ignore
    }
    remoteStreamRef.current = null;
    // Détache et ferme l'élément audio distant stable.
    try {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.pause();
        remoteAudioRef.current.removeAttribute("src");
        remoteAudioRef.current.srcObject = null;
        remoteAudioRef.current = null;
      }
    } catch {
      // ignore
    }
    micMutedRef.current = false;
    getUserMediaInProgressRef.current = false;
  }, []);

  // ── Lecture de l'audio distant (M6/M7) ───────────────────────
  // Utilise un HTMLAudioElement STABLE (un seul par cycle de vie), attaché via
  // srcObject. La décision de jouer/détacher est PURE (lib/webrtc-media).
  // IMPORTANT : ne lit AUCUN state React (closure stale au moment de ontrack) —
  // uniquement les refs. "Session active" = activeCallIdRef non nul (il est
  // effacé par resetCall/finishCall → jamais d'audio après session terminale).
  // L'autoplay est géré : si play() est rejeté (restriction navigateur), on
  // expose audioPlayFailed → l'UI peut proposer une interaction utilisateur.
  const attachRemoteAudio = useCallback((callId: string, role: "caller" | "callee") => {
    const stream = remoteStreamRef.current;
    if (!stream) return;
    const decision = decideRemoteAudio({
      streamPresent: true,
      streamEnded: stream.getTracks().some((t) => t.readyState === "ended"),
      sessionActive: activeCallIdRef.current !== null,
    });
    if (decision === "detach") {
      logMedia(callId, role, "remoteAudioDetached", { reason: "session not active" });
      return;
    }
    if (!remoteAudioRef.current) {
      remoteAudioRef.current = new Audio();
      remoteAudioRef.current.autoplay = true;
      remoteAudioRef.current.setAttribute("playsinline", "true");
    }
    const audio = remoteAudioRef.current;
    if (audio.srcObject !== stream) {
      audio.srcObject = stream;
      logMedia(callId, role, "remoteAudioAttached");
    }
    // play() peut être rejeté par autoplay restrictions → état exposé à l'UI.
    audio
      .play()
      .then(() => {
        setAudioPlayFailed(false);
        logMedia(callId, role, "audioPlayStarted");
      })
      .catch(() => {
        setAudioPlayFailed(true);
        logMedia(callId, role, "audioPlayFailed");
      });
  }, []);

  // Tente à nouveau de jouer l'audio distant (appelé depuis l'UI après une
  // interaction utilisateur si l'autoplay a été bloqué). Pure retry : aucune
  // re-création d'élément, aucune re-négociation.
  const retryRemoteAudio = useCallback(() => {
    const callId = activeCallIdRef.current;
    const role = activeCallRoleRef.current ?? "caller";
    const audio = remoteAudioRef.current;
    if (!audio) return;
    audio
      .play()
      .then(() => {
        setAudioPlayFailed(false);
        logMedia(callId, role, "audioPlayStarted");
        logCallState(callId, role, "audioPlayRecovered");
      })
      .catch(() => {
        setAudioPlayFailed(true);
        logMedia(callId, role, "audioPlayFailed");
      });
  }, []);

  // ── Fin d'appel (termine une session) ───────────────────────
  const finishCall = useCallback(
    async (status: "ENDED" | "FAILED" | "DECLINED" | "MISSED", reason?: string) => {
      const callId = activeCallIdRef.current;
      const role = activeCallRoleRef.current ?? "caller";
      if (!callId) {
        resetCall();
        return;
      }
      logCallState(callId, role, "callEnded", { status, reason });
      try {
        await fetch(`/api/app-calls/${callId}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status, reason }),
        });
      } catch {
        // ignore
      }
      logMedia(callId, role, "mediaCleanup", { status });
      resetCall();
    },
    [resetCall]
  );

  // ── Publication d'un signal via le SERVEUR (M2 : jamais de trigger direct) ──
  // Le client POSTe un payload ; le serveur authentifie, valide l'état, puis
  // publie sur le canal d'appel. `channel.trigger` direct est INTERDIT.
  const publishSignal = useCallback(async (callId: string, payload: SignalMessage) => {
    if (!callId) return;
    try {
      await fetch(`/api/app-calls/${callId}/signal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload }),
      });
    } catch (err) {
      console.error("publishSignal failed", err);
    }
  }, []);

  // ── Création du RTCPeerConnection + écoute du canal d'appel ──
  const setupPeerAndChannel = useCallback(
    async (
      callId: string,
      role: "caller" | "callee",
      isInitiator: boolean,
      peerUserId: string
    ) => {
      const previousCallId = activeCallIdRef.current;
      // M16 : protection multi-appel — ne crée PAS de nouvelle PeerConnection si
      // une connexion valide existe DÉJÀ pour CE callId (comparé AVANT d'écraser
      // activeCallIdRef). Une PC résiduelle d'un AUTRE callId = état incohérent :
      // on n'empile jamais deux PeerConnections / deux flux micro.
      {
        const existingPc = pcRef.current;
        if (
          existingPc &&
          existingPc.signalingState !== "closed" &&
          existingPc.connectionState !== "closed" &&
          existingPc.connectionState !== "failed" &&
          previousCallId === callId
        ) {
          logMedia(callId, role, "duplicateSetupSkipped");
          return;
        }
        if (existingPc && previousCallId !== callId) {
          logMedia(callId, role, "stalePcTornDown", { previousCallId });
          try {
            existingPc.onicecandidate = null;
            existingPc.ontrack = null;
            existingPc.onconnectionstatechange = null;
            existingPc.oniceconnectionstatechange = null;
            existingPc.close();
          } catch {
            // ignore
          }
          try {
            localStreamRef.current?.getTracks().forEach((t) => t.stop());
          } catch {
            // ignore
          }
          localStreamRef.current = null;
          pcRef.current = null;
        }
      }
      activeCallIdRef.current = callId;
      activeCallRoleRef.current = role;
      pendingCandidatesRef.current = [];
      peerUserIdRef.current = peerUserId;
      iceRestartCountRef.current = 0;
      iceRestartInProgressRef.current = false;
      // Polite/impolite DÉTERMINISTE par paire (mêmes IDs des deux côtés).
      politeRef.current = isPolitePair({ myId: userId ?? "", peerId: peerUserId });

      if (!callChannelRef.current) {
        callChannelRef.current = pusherRef.current!.subscribe(appCallChannels.call(callId));
        callChannelRef.current.bind(APP_CALL_EVENTS.SIGNAL, (message: any) => {
          handleSignal(message, role, isInitiator);
        });
      }

      // ── Microphone local (M2) ───────────────────────────────────────
      // Réutilise le flux local DÉJÀ acquis s'il est stable (aucun nouveau
      // getUserMedia inutile). Sinon, demande UNIQUEMENT l'audio, avec garde
      // anti-concurrence et gestion propre des erreurs de permission.
      let localStream = localStreamRef.current;
      if (!localStream || localStream.getAudioTracks().some((t) => t.readyState === "ended")) {
        if (getUserMediaInProgressRef.current) {
          logMedia(callId, role, "getUserMediaBusy");
          finishCall("FAILED", "microphone request already in progress");
          const busyErr = new Error("microphone request already in progress");
          (busyErr as Error & { isMediaError?: boolean }).isMediaError = true;
          throw busyErr;
        }
        getUserMediaInProgressRef.current = true;
        logMedia(callId, role, "microphoneRequested");
        try {
          localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          logMedia(callId, role, "microphoneGranted");
        } catch (err) {
          getUserMediaInProgressRef.current = false;
          const kind: MediaErrorKind = classifyGetUserMediaError(err);
          logMedia(callId, role, "microphone" + (kind === "permission-denied" ? "Denied" : "Failed"), {
            errorKind: kind,
            errorCode: (err as DOMException)?.name || undefined,
          });
          // Termine proprement la session — ne reste JAMAIS bloqué en CONNECTING.
          finishCall("FAILED", mediaFailReason(kind));
          const mediaErr = new Error(mediaFailReason(kind));
          (mediaErr as Error & { isMediaError?: boolean }).isMediaError = true;
          (mediaErr as Error & { mediaErrorKind?: MediaErrorKind }).mediaErrorKind = kind;
          throw mediaErr;
        }
        getUserMediaInProgressRef.current = false;
      }
      localStreamRef.current = localStream;

      // M10 : configuration ICE issue du serveur (STUN/TURN).
      if (!iceConfigRef.current) {
        try {
          const res = await fetch("/api/app-calls/ice-config");
          if (res.ok) {
            const cfg = await res.json();
            if (Array.isArray(cfg.iceServers) && cfg.iceServers.length > 0) {
              iceConfigRef.current = { iceServers: cfg.iceServers };
            }
          }
        } catch {
          // ignore → fallback rtcConfiguration()
        }
      }

      const pc = new RTCPeerConnection(
        iceConfigRef.current ?? rtcConfiguration()
      );
      pcRef.current = pc;
      // M4 : ajout des pistes locales — chaque track audio UNE seule fois,
      // aucune après fermeture / état failed, et anti-doublon via getSenders().
      const existingSenderKinds = new Set(
        pc.getSenders().map((s) => s.track?.kind).filter(Boolean)
      );
      for (const track of localStream.getAudioTracks()) {
        if (!shouldAddTrack({ pcState: pc.signalingState, alreadyHasAudioTrack: existingSenderKinds.has("audio") })) {
          logMedia(callId, role, "localTrackSkipped", { reason: "duplicate-or-closed" });
          continue;
        }
        pc.addTrack(track, localStream);
        existingSenderKinds.add("audio");
        logMedia(callId, role, "localTrackAdded");
      }
      if (micMutedRef.current) {
        // M8 : mute = track.enabled (audio uniquement), jamais re-négociation.
        setAudioTracksEnabled(localStream.getTracks(), false);
      }

      pc.onicecandidate = (ev) => {
        if (ev.candidate) {
          const c = ev.candidate;
          logIce(callId, role, "iceCandidate", {
            candidateType: c.type,
            protocol: c.protocol,
          });
          publishSignal(callId, {
            type: "ICE_CANDIDATE",
            candidate: c.toJSON(),
          });
        }
      };
      pc.onicecandidateerror = (ev) => {
        logIce(callId, role, "iceCandidateError", {
          errorCode: (ev as RTCPeerConnectionIceErrorEvent).errorCode,
          errorText: (ev as RTCPeerConnectionIceErrorEvent).errorText,
        });
      };
      pc.ontrack = (ev) => {
        // M5 : remote track. On réutilise la référence STABLE du flux distant
        // quand il existe (ne pas recréer un MediaStream à chaque événement).
        // Plusieurs événements `track` peuvent appartenir au même stream.
        const incoming = ev.streams?.[0] ?? new MediaStream([ev.track]);
        let stream = remoteStreamRef.current;
        if (!stream || stream.getTracks().every((t) => t.readyState === "ended")) {
          stream = incoming;
          remoteStreamRef.current = stream;
        }
        // Ajoute la track manquante au stream existant (multi-track).
        if (!stream.getTracks().includes(ev.track)) {
          stream.addTrack(ev.track);
        }
        setRemoteStream(stream);
        logMedia(callId, role, "remoteTrackReceived", {
          trackKind: ev.track.kind,
          trackCount: stream.getTracks().length,
        });
        // Jouer l'audio distant dès réception (M6/M7).
        attachRemoteAudio(callId, role);
      };
      pc.onicegatheringstatechange = () => {
        logIce(callId, role, "iceGatheringState", {
          state: pc.iceGatheringState,
        });
      };
      pc.onsignalingstatechange = () => {
        logIce(callId, role, "signalingState", {
          state: pc.signalingState,
        });
        if (pc.signalingState === "stable" && makingOfferRef.current) {
          makingOfferRef.current = false;
        }
      };
      pc.onnegotiationneeded = async () => {
        if (!makingOfferRef.current) {
          makingOfferRef.current = true;
          try {
            await pc.setLocalDescription();
          } catch (err) {
            console.error("[WebRTC] onnegotiationneeded failed", err);
            makingOfferRef.current = false;
          }
        }
      };
      pc.onconnectionstatechange = () => {
        logIce(callId, role, "connectionState", { state: pc.connectionState });

        if (pc.connectionState === "connected") {
          // Succès : réinitialiser les compteurs de restart.
          if (iceRestartCountRef.current > 0) {
            logIce(callId, role, "iceRestartSucceeded", {
              attempts: iceRestartCountRef.current,
              max: ICE_RESTART_MAX_ATTEMPTS,
            });
          }
          logCallState(callId, role, "callConnected");
          iceRestartCountRef.current = 0;
          iceRestartInProgressRef.current = false;
          setConnected(true);
          setAppCallStatus("ACTIVE");
          fetch(`/api/app-calls/${callId}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "ACTIVE" }),
          }).catch(() => {});
        } else if (pc.connectionState === "failed") {
          // `failed` sur connectionState = échec définitif de la couche transport.
          // On tente un ICE restart AVANT de terminer l'appel.
          if (activeCallIdRef.current !== callId) return;
          const canRestart = canAttemptIceRestart({
            inProgress: iceRestartInProgressRef.current,
            attempts: iceRestartCountRef.current,
            maxAttempts: ICE_RESTART_MAX_ATTEMPTS,
            sessionTerminal: false,
            signalingState: pc.signalingState,
          });
          if (canRestart) {
            iceRestartInProgressRef.current = true;
            iceRestartCountRef.current += 1;
            logIce(callId, role, "connectionFailed_restartAttempt", {
              attempt: iceRestartCountRef.current,
              max: ICE_RESTART_MAX_ATTEMPTS,
            });
            (async () => {
              try {
                pc.restartIce();
                if (pc.signalingState !== "stable") {
                  iceRestartInProgressRef.current = false;
                  return;
                }
                makingOfferRef.current = true;
                const offer = await pc.createOffer({ iceRestart: true });
                await pc.setLocalDescription(offer);
                publishSignal(callId, { type: "CALL_OFFER", sdp: offer });
              } catch (err) {
                logIce(callId, role, "restartFailed", { error: String(err) });
                iceRestartInProgressRef.current = false;
                finishCall("FAILED", "ice restart failed");
              }
            })();
          } else if (!iceRestartInProgressRef.current) {
            logIce(callId, role, "connectionFailed_terminal");
            finishCall("FAILED", "connection failed");
          }
          // else: restart already in progress from oniceconnectionstatechange → let it complete
        } else if (pc.connectionState === "closed") {
          if (activeCallIdRef.current === callId) {
            finishCall("ENDED", "connection closed");
          }
        }
      };
      pc.oniceconnectionstatechange = () => {
        logIce(callId, role, "iceConnectionState", { state: pc.iceConnectionState });

        if (activeCallIdRef.current !== callId) return;

        const decision = decideIceFailure({
          iceConnectionState: pc.iceConnectionState,
          connectionState: pc.connectionState,
        });

        if (decision === "terminal") {
          if (!iceRestartInProgressRef.current) {
            logIce(callId, role, "iceTerminal");
            finishCall("FAILED", `ice ${pc.iceConnectionState}`);
          }
          // else: restart already in progress from onconnectionstatechange → let it complete
        } else if (decision === "restart") {
          // ICE failed mais connectionState pas encore "failed" → on tente
          // un restart ici aussi (certains navigateurs mettent plus de temps
          // à basculer connectionState en "failed").
          const canRestart = canAttemptIceRestart({
            inProgress: iceRestartInProgressRef.current,
            attempts: iceRestartCountRef.current,
            maxAttempts: ICE_RESTART_MAX_ATTEMPTS,
            sessionTerminal: false,
            signalingState: pc.signalingState,
          });
          if (canRestart) {
            iceRestartInProgressRef.current = true;
            iceRestartCountRef.current += 1;
            logIce(callId, role, "iceFailed_restartAttempt", {
              attempt: iceRestartCountRef.current,
              max: ICE_RESTART_MAX_ATTEMPTS,
            });
            (async () => {
              try {
                pc.restartIce();
                if (pc.signalingState !== "stable") {
                  iceRestartInProgressRef.current = false;
                  return;
                }
                makingOfferRef.current = true;
                const offer = await pc.createOffer({ iceRestart: true });
                await pc.setLocalDescription(offer);
                publishSignal(callId, { type: "CALL_OFFER", sdp: offer });
              } catch (err) {
                logIce(callId, role, "restartFailed", { error: String(err) });
                iceRestartInProgressRef.current = false;
                finishCall("FAILED", "ice restart failed");
              }
            })();
          } else if (!iceRestartInProgressRef.current) {
            logIce(callId, role, "iceFailed_noRestartLeft");
            finishCall("FAILED", "ice failed after restart attempts");
          }
          // else: restart already in progress from onconnectionstatechange → let it complete
        }
        // "wait" = disconnected est transitoire → on laisse le navigateur tenter
        // de se rétablir. Aucune action requise.
      };

      // Le callee signale qu'il est prêt avant que le caller envoie l'offer.
      if (role === "callee") {
        publishSignal(callId, { type: "CALL_READY" });
      }
    },
    [publishSignal, attachRemoteAudio, finishCall, resetCall]
  );

  // Fonction handleSignal référencée par le binding (définie plus loin par fermeture).
  async function handleSignal(
    message: ServerCallSignal,
    role: "caller" | "callee",
    isInitiator: boolean
  ) {
    const pc = pcRef.current;
    if (!pc || pc.signalingState === "closed") return;

    // M5 : ignore les candidats dont la session ne correspond plus à la session
    // active (ré-utilisation du même binding après un appel).
    if (message.sessionId && message.sessionId !== activeCallIdRef.current) {
      return;
    }

    // M5 : si un candidat arrive avant la description distante, on le met en file
    // (sinon addIceCandidate échoue). Appliqué après le setRemoteDescription.
    // Décision PURE (lib/webrtc-negotiation).
    const queueOrAddCandidate = async (candidate?: RTCIceCandidateInit) => {
      if (!candidate) return;
      const decision = decideIceCandidate({
        signalingState: pc.signalingState,
        remoteDescriptionPresent: !!pc.remoteDescription,
        sessionTerminal: pc.connectionState === "closed",
      });
      if (decision === "ignore") return;
      if (decision === "queue") {
        pendingCandidatesRef.current.push(candidate);
        return;
      }
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("addIceCandidate failed", err);
      }
    };

    try {
      const p = message.payload;
      if (p.type === "CALL_READY" && role === "caller") {
        peerReadyRef.current = true;
        // Garde perfect negotiation : une seule offre en vol à la fois.
        if (isInitiator && canMakeOffer({ makingOffer: makingOfferRef.current })) {
          makingOfferRef.current = true;
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            publishSignal(activeCallIdRef.current!, { type: "CALL_OFFER", sdp: offer });
          } catch (err) {
            console.error("createOffer failed", err);
            makingOfferRef.current = false;
          }
        }
      } else if (p.type === "CALL_OFFER" && role === "callee") {
        // Collision d'offre : décision PURE selon le rôle polite/impolite.
        if (ignoreOfferRef.current) {
          // Offre correspondant à la collision déjà traitée par rollback.
          return;
        }
        const decision = decideIncomingOffer({
          signalingState: pc.signalingState,
          polite: politeRef.current,
        });
        if (decision === "rollback") {
          // Impolite perd la collision : on annule notre description locale,
          // puis on traite la nouvelle offre qui suit (fall-through).
          try {
            await pc.setLocalDescription({ type: "rollback" });
          } catch {
            // rollback impossible en l'état → on laisse l'événement suivant.
          }
          ignoreOfferRef.current = true;
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(p.sdp!));
          } catch {
            // L'offre collée a déjà été consommée ; on s'appuie sur la suivante.
          }
          ignoreOfferRef.current = false;
          await flushPendingCandidates();
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          publishSignal(activeCallIdRef.current!, { type: "CALL_ANSWER", sdp: answer });
          return;
        }
        await pc.setRemoteDescription(new RTCSessionDescription(p.sdp!));
        ignoreOfferRef.current = false;
        await flushPendingCandidates();
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        publishSignal(activeCallIdRef.current!, { type: "CALL_ANSWER", sdp: answer });
      } else if (p.type === "CALL_ANSWER" && role === "caller") {
        // On mémorise que l'on s'apprête à appliquer une réponse : en cas de
        // nouvelle collision, l'impolite saura qu'un rollback est nécessaire.
        isSettingRemoteAnswerPendingRef.current = true;
        if (!canApplyRemoteDescription({
          signalingState: pc.signalingState,
          sessionTerminal: pc.connectionState === "closed",
        })) {
          return;
        }
        await pc.setRemoteDescription(new RTCSessionDescription(p.sdp!));
        isSettingRemoteAnswerPendingRef.current = false;
        await flushPendingCandidates();
      } else if (p.type === "ICE_CANDIDATE") {
        await queueOrAddCandidate(p.candidate);
      }
    } catch (err) {
      console.error("handleSignal failed", err);
    }
  }

  // M5 : applique les candidats ICE mis en file dès que la description distante
  // est posée. PURE de toute autre logique — idempotent via purge de la file.
  async function flushPendingCandidates() {
    const pc = pcRef.current;
    if (!pc) return;
    const pending = pendingCandidatesRef.current;
    pendingCandidatesRef.current = [];
    for (const cand of pending) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(cand));
      } catch (err) {
        console.error("flushPendingCandidates failed", err);
      }
    }
  }

  // ── makeAppCall ─────────────────────────────────────────────
  const makeAppCall = useCallback(
    async (target: string) => {
      setError(null);
      if (!userId) {
        toast.error("Non authentifié");
        return;
      }
      try {
        const res = await fetch("/api/app-calls", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ target }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          toast.error(bodyMessage(data.error ?? "Appel refusé"));
          return;
        }
        const data = await res.json();
        maxDurationRef.current = data.fairUse?.maxCallDurationSeconds ?? 3600;
        setOutboundPeer({
          name: data.call.callee?.name ?? null,
          username: data.call.callee?.callUsername ?? null,
        });
        setAppCallStatus("OFFERING");
        logCallState(data.call.id, "caller", "callOffering");
        await setupPeerAndChannel(data.call.id, "caller", true, data.call.callee?.id);
      } catch (err) {
        console.error(err);
        // Erreur média (micro refusé/introuvable) : finishCall a DÉJÀ terminé la
        // session en FAILED côté serveur — on ne réécrase pas avec "idle".
        if ((err as Error & { isMediaError?: boolean })?.isMediaError) {
          const kind = (err as Error & { mediaErrorKind?: MediaErrorKind }).mediaErrorKind;
          toast.error(kind ? mediaErrorMessage(kind) : "Impossible d'accéder au microphone");
          return;
        }
        setError("Impossible de lancer l'appel");
        toast.error("Impossible de lancer l'appel");
        setAppCallStatus("idle");
      }
    },
    [userId, setupPeerAndChannel]
  );

  // ── acceptAppCall ───────────────────────────────────────────
  const acceptAppCall = useCallback(async () => {
    const incoming = incomingAppCall;
    if (!incoming) return;
    setAppCallStatus("CONNECTING");
    logCallState(incoming.callId, "callee", "callAccepting");
    try {
      await fetch(`/api/app-calls/${incoming.callId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CONNECTING" }),
      });
      setIncomingAppCall(null);
      await setupPeerAndChannel(incoming.callId, "callee", false, incoming.callerId);
      setAppCallStatus("CONNECTING");
    } catch (err) {
      console.error(err);
      // Erreur média : finishCall a déjà terminé la session — pas de "idle" écrasant.
      if ((err as Error & { isMediaError?: boolean })?.isMediaError) {
        const kind = (err as Error & { mediaErrorKind?: MediaErrorKind }).mediaErrorKind;
        toast.error(kind ? mediaErrorMessage(kind) : "Impossible d'accéder au microphone");
        return;
      }
      setError("Impossible de répondre");
      setAppCallStatus("idle");
    }
  }, [incomingAppCall, setupPeerAndChannel]);

  // ── declineAppCall ──────────────────────────────────────────
  const declineAppCall = useCallback(async () => {
    const incoming = incomingAppCall;
    if (!incoming) return;
    await finishCall("DECLINED");
  }, [incomingAppCall, finishCall]);

  // ── hangupAppCall ───────────────────────────────────────────
  const hangupAppCall = useCallback(() => {
    finishCall("ENDED");
  }, [finishCall]);

  // ── muteAppMic ──────────────────────────────────────────────
  const muteAppMic = useCallback((muted: boolean) => {
    micMutedRef.current = muted;
    // M8 : mute = track.enabled sur les pistes AUDIO uniquement. Ne touche
    // JAMAIS la PeerConnection, le signaling, ni l'état de session. La
    // connexion WebRTC reste ACTIVE. Unmute réactive la MÊME track (aucun
    // nouveau getUserMedia, aucun duplicate sender).
    const tracks = localStreamRef.current?.getTracks() ?? [];
    setAudioTracksEnabled(tracks, !muted);
    logMedia(activeCallIdRef.current, activeCallRoleRef.current ?? "caller", muted ? "localMute" : "localUnmute", {
      trackCount: tracks.filter((t) => t.kind === "audio").length,
    });
  }, []);

  // ── refreshDirectory ────────────────────────────────────────
  const refreshDirectory = useCallback(async () => {
    try {
      const res = await fetch("/api/app-calls/directory");
      if (res.ok) {
        const data = await res.json();
        setDirectory(data.users ?? []);
      }
    } catch {
      // ignore
    }
  }, []);

  // ── Souscription au canal privé utilisateur (incoming + état) ──
  useEffect(() => {
    if (!userId) return;
    resetCall();

    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
    if (!pusherKey) {
      console.warn("[AppCall] NEXT_PUBLIC_PUSHER_KEY not set — real-time call features disabled");
      return;
    }

    const pusher = new Pusher(pusherKey, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "eu",
      channelAuthorization: {
        endpoint: "/api/pusher/auth",
        transport: "ajax",
      },
    });
    pusherRef.current = pusher;
    const userChannel = pusher.subscribe(appCallChannels.user(userId));

    // Observabilité : succès / échec d'abonnement au canal utilisateur.
    userChannel.bind("pusher:subscription_succeeded", () => {
      logCallState(null, "caller", "pusherSubscriptionSucceeded", {
        channel: appCallChannels.user(userId),
      });
    });
    userChannel.bind("pusher:subscription_error", (status: any) => {
      console.warn("[AppCall] Pusher subscription_error", status);
      logCallState(null, "caller", "pusherSubscriptionError", {
        status: String(status ?? ""),
      });
    });

    // M7 : reconnect Pusher — Pusher-js se reconnecte automatiquement, mais on
    // s'assure qu'un appel en cours restaure son abonnement au canal d'appel
    // après une reconnexion (les bindings du canal d'appel sont posés dans
    // setupPeerAndChannel ; ici on re-déclenche le re-subscribe au besoin).
    const onConnectionAvailable = () => {
      if (activeCallIdRef.current && callChannelRef.current) {
        try {
          callChannelRef.current =
            pusher.subscribe(appCallChannels.call(activeCallIdRef.current));
          // Re-small-scale : les bindings de signal sont posés par
          // setupPeerAndChannel ; une réconnexion pleine du canal d'appel est
          // gérée par Pusher -js automatiquement. Ici on ne fait qu'alourdir la
          // re-souscription pour la robustesse (aucune double-bind).
        } catch {
          // ignore
        }
      }
    };
    pusher.connection.bind("connected", onConnectionAvailable);
    pusher.connection.bind("connection:error", (data: any) => {
      console.warn("[AppCall] Pusher connection error", data);
      logCallState(null, "caller", "pusherConnectionError", {
        error: String(data?.error?.message ?? data ?? ""),
      });
    });
    pusher.connection.bind("reconnecting", (data: any) => {
      console.warn("[AppCall] Pusher reconnecting", data);
    });
    pusher.connection.bind("disconnected", () => {
      console.warn("[AppCall] Pusher disconnected");
    });

    userChannel.bind(APP_CALL_EVENTS.INCOMING, (data: any) => {
      setIncomingAppCall({
        callId: data.callId,
        callerId: data.caller?.id ?? "",
        callerName: data.caller?.name ?? null,
        callerUsername: data.caller?.callUsername ?? null,
        callerExtension: data.caller?.callExtension ?? null,
      });
      maxDurationRef.current = data.fairUse?.maxCallDurationSeconds ?? 3600;
      setAppCallStatus("RINGING");
      logCallState(data.callId, "callee", "callRinging");
    });

    userChannel.bind(APP_CALL_EVENTS.ACCEPTED, (data: any) => {
      // Le caller a déjà créé son RTCPeerConnection + abonné au canal d'appel
      // dans makeAppCall. Il attend simplement le signal "ready" du callee
      // sur le canal d'appel pour envoyer son offre. Rien à faire ici.
      peerReadyRef.current = false;
    });

    userChannel.bind(APP_CALL_EVENTS.DECLINED, (data: any) => {
      logCallState(
        data?.callId ?? activeCallIdRef.current,
        activeCallRoleRef.current ?? "caller",
        "callDeclinedByPeer"
      );
      setError("Destinataire a refusé");
      resetCall();
    });

    userChannel.bind(APP_CALL_EVENTS.CANCELLED, (data: any) => {
      logCallState(
        data?.callId ?? activeCallIdRef.current,
        activeCallRoleRef.current ?? "caller",
        "callCancelledByPeer"
      );
      setError("Appel annulé");
      resetCall();
    });

    userChannel.bind(APP_CALL_EVENTS.ENDED, (data: any) => {
      logCallState(
        data?.callId ?? activeCallIdRef.current,
        activeCallRoleRef.current ?? "caller",
        "callEndedByPeer",
        data?.reason ? { reason: data.reason } : undefined
      );
      resetCall();
    });

    refreshDirectory();

    return () => {
      try {
        pusher.connection.unbind("connected", onConnectionAvailable);
        pusher.connection.unbind("connection:error");
        pusher.connection.unbind("reconnecting");
        pusher.connection.unbind("disconnected");
      } catch {
        // ignore
      }
      userChannel.unbind_all();
      userChannel.unsubscribe();
      pusher.disconnect();
      pusherRef.current = null;
      resetCall();
    };
  }, [userId, resetCall, setupPeerAndChannel, refreshDirectory]);

  // ── Timer de durée + limite fair-use ─────────────────────────
  useEffect(() => {
    if (appCallStatus !== "ACTIVE") {
      setAppCallDuration(0);
      return;
    }
    const interval = setInterval(() => {
      setAppCallDuration((prev) => {
        const next = prev + 1;
        if (next >= maxDurationRef.current) {
          finishCall("ENDED");
          return prev;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [appCallStatus, finishCall]);

  const value = useMemo<AppCallContextValue>(
    () => ({
      appCallStatus,
      incomingAppCall,
      outboundPeer,
      remoteStream,
      audioPlayFailed,
      retryRemoteAudio,
      appCallDuration,
      connected,
      error,
      directory,
      makeAppCall,
      acceptAppCall,
      declineAppCall,
      hangupAppCall,
      muteAppMic,
      refreshDirectory,
    }),
    [
      appCallStatus,
      incomingAppCall,
      outboundPeer,
      remoteStream,
      audioPlayFailed,
      retryRemoteAudio,
      appCallDuration,
      connected,
      error,
      directory,
      makeAppCall,
      acceptAppCall,
      declineAppCall,
      hangupAppCall,
      muteAppMic,
      refreshDirectory,
    ]
  );

  return <AppCallContext.Provider value={value}>{children}</AppCallContext.Provider>;
}

function bodyMessage(code: string | undefined): string {
  const map: Record<string, string> = {
    CALLEE_NOT_FOUND: "Utilisateur introuvable",
    MAX_CONCURRENT_CALLS: "Trop d'appels simultanés (fair-use)",
    MAX_CALLS_PER_HOUR: "Limite horaire atteinte (fair-use)",
    MAX_CALLS_PER_DAY: "Limite journalière atteinte (fair-use)",
    NO_PLAN: "Aucun plan actif",
    PLAN_INACTIVE: "Plan inactif",
  };
  return map[code ?? ""] ?? "Appel refusé";
}

export function useAppCall() {
  const ctx = useContext(AppCallContext);
  if (!ctx) {
    throw new Error("useAppCall must be used within AppCallProvider");
  }
  return ctx;
}
