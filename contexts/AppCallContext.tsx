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
  // Fallback minimal : STUN public Google. La configuration principale est
  // servie par /api/app-calls/ice-config (qui inclut TURN si configuré).
  return {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
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
  const [directory, setDirectory] = useState<AppCallContextValue["directory"]>([]);

  const pusherRef = useRef<Pusher | null>(null);
  const callChannelRef = useRef<any>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const activeCallIdRef = useRef<string | null>(null);
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
    setAppCallDuration(0);
    activeCallIdRef.current = null;
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
    // Arrête TOUTES les pistes (audio local, piste distante) pour libérer le micro.
    try {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    } catch {
      // ignore
    }
    localStreamRef.current = null;
    micMutedRef.current = false;
  }, []);

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
      activeCallIdRef.current = callId;
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

      const localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
      localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));
      if (micMutedRef.current) {
        localStream.getTracks().forEach((t) => (t.enabled = !micMutedRef.current));
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
        if (ev.streams?.[0]) setRemoteStream(ev.streams[0]);
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
    [publishSignal]
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

  // ── Fin d'appel (termine une session) ───────────────────────
  const finishCall = useCallback(
    async (status: "ENDED" | "FAILED" | "DECLINED" | "MISSED", reason?: string) => {
      const callId = activeCallIdRef.current;
      if (!callId) {
        resetCall();
        return;
      }
      try {
        await fetch(`/api/app-calls/${callId}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status, reason }),
        });
      } catch {
        // ignore
      }
      resetCall();
    },
    [resetCall]
  );

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
        await setupPeerAndChannel(data.call.id, "caller", true, data.call.callee?.id);
      } catch (err) {
        console.error(err);
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
    localStreamRef.current?.getTracks().forEach((t) => (t.enabled = !muted));
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
    });

    userChannel.bind(APP_CALL_EVENTS.ACCEPTED, (data: any) => {
      // Le caller a déjà créé son RTCPeerConnection + abonné au canal d'appel
      // dans makeAppCall. Il attend simplement le signal "ready" du callee
      // sur le canal d'appel pour envoyer son offre. Rien à faire ici.
      peerReadyRef.current = false;
    });

    userChannel.bind(APP_CALL_EVENTS.DECLINED, (data: any) => {
      setError("Destinataire a refusé");
      resetCall();
    });

    userChannel.bind(APP_CALL_EVENTS.CANCELLED, (data: any) => {
      setError("Appel annulé");
      resetCall();
    });

    userChannel.bind(APP_CALL_EVENTS.ENDED, (data: any) => {
      resetCall();
    });

    refreshDirectory();

    return () => {
      try {
        pusher.connection.unbind("connected", onConnectionAvailable);
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
