"use client";

import React, { createContext, useCallback, useContext, useEffect, useState, useRef } from "react";
// @ts-ignore
import { TelnyxRTC } from "@telnyx/webrtc";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import Pusher from "pusher-js";
import { appCallChannels, PSTN_EVENTS } from "@/lib/app-call-channels";
import {
  classifyCallUpdate,
  correlateIncoming,
  decideAcceptAction,
  getCallControlId,
  isTerminalSdkState,
  resolvePendingIncoming,
  sameSdkCall,
  shouldEndIncoming,
  type AcceptAction,
  type PendingCall,
  type SdkCallLike,
} from "@/lib/pstn-correlation";

type CallState = "idle" | "ringing" | "connecting" | "active" | "held" | "error";

interface TelnyxContextValue {
  isRegistered: boolean;
  registrationError: string | null;
  callState: CallState;
  callDirection: "inbound" | "outbound" | null;
  activeCallId: string | null;
  incomingCallerId: string | null;
  remoteStream: MediaStream | null;
  makeCall: (destination: string, callerId?: string) => void;
  answerCall: () => void;
  rejectCall: () => void;
  hangupCall: () => void;
  muteMicrophone: (muted: boolean) => void;
  sendDTMF: (digit: string) => void;
  requestAudioUnlock: () => void;
  debugLog: string;
}

const TelnyxContext = createContext<TelnyxContextValue | undefined>(undefined);

export const useTelnyx = () => {
  const context = useContext(TelnyxContext);
  if (!context) {
    throw new Error("useTelnyx must be used within a TelnyxProvider");
  }
  return context;
};

// ── Paramètres du flux média ───────────────────────────────────────────────
const PENDING_SDK_WINDOW_MS = 15000; // âge max d'un Call SDK "candidat" non encore corrélé
const SDK_WAIT_TIMEOUT_MS = 5000; // attente bornée d'un Call SDK corrélé à l'Accept
const SDK_WAIT_POLL_MS = 120; // cadence du poll (Pas de stale closure : refs only)
const MEDIA_WARNING_MS = 12000; // garde-API : alerte après N ms sans média SDK

export const TelnyxProvider = ({ children }: { children: React.ReactNode }) => {
  const { data: session } = useSession();
  const clientRef = useRef<any>(null);
  const currentCallRef = useRef<any>(null);

  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [callState, setCallState] = useState<CallState>("idle");
  const [callDirection, setCallDirection] = useState<"inbound" | "outbound" | null>(null);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [incomingCallerId, setIncomingCallerId] = useState<string | null>(null);
  const [pstnCallControlId, setPstnCallControlId] = useState<string | null>(null);

  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [debugLog, setDebugLog] = useState<string>("");

  // ── Références stables (avoid stale closures dans les handlers liés UNE fois) ──
  const callStateRef = useRef(callState);
  const pstnCallControlIdRef = useRef<string | null>(null);
  /** Registre SDK : callControlId → Call. C'est la SOURCE de vérité du Call média. */
  const sdkCallsRef = useRef<Record<string, any>>({});
  /** Candidats SDK dont le callControlId n'est PAS encore peuplé (nécessaire : le SDK
   *  lie l'id sur les messages ringing/answer, pas forcément au 1er callUpdate ringing). */
  const unknownSdkRef = useRef<PendingCall[]>([]);
  /** callControlId déjà consommés (answer/reject/hangup/ended) → replay ignoré. */
  const consumedRef = useRef<Set<string>>(new Set());
  /** Anti double-Accept / double-answer. */
  const acceptInFlightRef = useRef(false);
  /** Incrémenté à chaque reset : invalide les boucles d'attente en vol. */
  const waitGenerationRef = useRef(0);

  // Synchronisation POST-render (jamais d'accès ref pendant le render).
  useEffect(() => {
    callStateRef.current = callState;
    pstnCallControlIdRef.current = pstnCallControlId;
  });

  // ─── Helpers refs-only (aucune closure état, utilisables dans les handlers liés) ───

  const nowTs = () => Date.now();
  const unknownKeyOf = (call: any): string | null => (call?.id || call?.callId || null) as string | null;

  /** Enregistre un Call SDK observé. Clé par callControlId quand connu, sinon candidat. */
  const registerSdkCall = useCallback((call: any) => {
    if (!call) return;
    const cc = getCallControlId(call as SdkCallLike);
    const key = unknownKeyOf(call);
    if (cc) {
      sdkCallsRef.current[cc] = call;
      if (key) {
        unknownSdkRef.current = unknownSdkRef.current.filter((p) => p.key !== key);
      }
    } else if (key) {
      const exists = unknownSdkRef.current.some((p) => p.key === key);
      if (!exists) {
        unknownSdkRef.current.push({ call, key, controlId: null, timestamp: nowTs() });
      }
    }
  }, []);

  const unregisterSdkCall = useCallback((call: any) => {
    if (!call) return;
    const cc = getCallControlId(call as SdkCallLike);
    const key = unknownKeyOf(call);
    if (cc) delete sdkCallsRef.current[cc];
    if (key) {
      unknownSdkRef.current = unknownSdkRef.current.filter((p) => p.key !== key);
    }
  }, []);

  /** Corrélation EXACTE : un Call SDK n'est utilisable que si son callControlId
   *  (telnyxIDs/options) == callControlId du PSTN courant. */
  const findCorrelatedSdkCall = useCallback((expected: string | null): any | null => {
    if (!expected) return null;
    const fromMap = sdkCallsRef.current[expected];
    if (fromMap && correlateIncoming(fromMap as SdkCallLike, expected)) return fromMap;
    if (currentCallRef.current && correlateIncoming(currentCallRef.current as SdkCallLike, expected)) {
      return currentCallRef.current;
    }
    const resolution = resolvePendingIncoming(unknownSdkRef.current, expected, nowTs(), PENDING_SDK_WINDOW_MS);
    return resolution.matched?.call ?? null;
  }, []);

  /** Reset total et idempotent du contexte d'appel (idle + refs + registre). */
  const resetPstnState = useCallback((cc?: string | null) => {
    waitGenerationRef.current++;
    const currentCc = pstnCallControlIdRef.current;
    if (currentCc) consumedRef.current.add(currentCc);
    unregisterSdkCall(currentCallRef.current);
    sdkCallsRef.current = {};
    unknownSdkRef.current = [];
    currentCallRef.current = null;
    setPstnCallControlId(null);
    pstnCallControlIdRef.current = null;
    setCallState("idle");
    setCallDirection(null);
    setActiveCallId(null);
    setIncomingCallerId(null);
    setRemoteStream(null);
    void cc; // l'id terminé est déjà "consommé" via currentCc ci-dessus
  }, [unregisterSdkCall]);

  const logTag = useCallback((tag: string, extra?: Record<string, unknown>) => {
    const line = extra
      ? `${tag} ${Object.entries(extra).map(([k, v]) => `${k}=${v}`).join(" ")}`
      : tag;
    console.log(`[${line}]`);
    setDebugLog((prev) => (prev ? `${prev} | ${tag}` : tag));
  }, []);

  /** Notification SDK d'un appel qui est le NÔTRE (corrélé ou natif outbound). */
  const isMine = useCallback(
    (call: any): boolean => {
      const cc = getCallControlId(call as SdkCallLike);
      if (cc) return cc === pstnCallControlIdRef.current;
      // CC inconnu : seul un Call déjà lié via currentCallRef (ex. outbound) est nôtre.
      return !!currentCallRef.current && sameSdkCall(call as SdkCallLike, currentCallRef.current as SdkCallLike);
    },
    [],
  );

  useEffect(() => {
    let disposed = false;

    const initTelnyx = async () => {
      try {
        // Demander d'abord la permission microphone (important pour Chrome)
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (e) {
          console.warn("Microphone permission not granted yet or denied", e);
        }

        if (disposed) return;

        // Fetch token from our new secure backend route
        const response = await fetch("/api/telnyx/token");
        if (!response.ok) {
          if (disposed) return;
          try {
            const errData = await response.json();
            setRegistrationError(errData.error || "Erreur serveur (Token)");
          } catch {
            setRegistrationError("Erreur serveur (Token)");
          }
          return;
        }

        const data = await response.json();
        const token = data.token;

        if (disposed) return;

        // Initialize Telnyx WebRTC Client (un seul client à la fois)
        const client = new TelnyxRTC({
          login_token: token,
          remoteElement: "telnyx-remote-audio", // le SDK y rattache le remoteStream + play()
        } as any);

        clientRef.current = client;

        client.on("telnyx.ready", () => {
          if (disposed) return;
          setIsRegistered(true);
          console.log("Telnyx WebRTC Ready");
        });

        client.on("telnyx.error", (err: any) => {
          if (disposed) return;
          setRegistrationError(err.message || "Connection failed");
        });

        client.on("telnyx.notification", (notification: any) => {
          const call = notification.call;
          const logMsg = `${notification.type} -> ${call?.state}`;
          console.log("[Telnyx Notification]", logMsg);
          setDebugLog((prev) => (prev ? `${prev} | ${logMsg}` : logMsg));

          if (!call) return;

          switch (notification.type) {
            case "callUpdate": {
              // 1) On observe TOUJOURS le Call (registre + candidats) — la corrélation
              //    strictement par callControlId décide ensuite si on agit dessus.
              registerSdkCall(call);
              const kind = classifyCallUpdate(call as SdkCallLike);
              const mine = isMine(call);

              if (kind === "ringing") {
                if (mine) {
                  // Notre appel (inbound corrélé au PSTN courant, sinon outbound déjà affiché).
                  currentCallRef.current = call;
                  const cc = getCallControlId(call as SdkCallLike);
                  if (cc && cc === pstnCallControlIdRef.current) {
                    // Inbound Pusher → l'UI de sonnerie est déjà affichée (ou arrive) ;
                    // on garantit que currentCallRef porte le Call média pour Accept.
                    if (callStateRef.current === "idle") {
                      setCallState("ringing");
                      setCallDirection("inbound");
                      setIncomingCallerId(
                        call.options?.remoteCallerName || call.options?.remoteCallerNumber || "Appel entrant",
                      );
                    }
                  }
                  // Outbound : l'UI a été posée par makeCall ; rien à faire ici.
                }
                // Foreign (autre tenant/org) : NI UI NI liaison — la barrière est la corrélation.
              } else if (kind === "active") {
                if (mine) {
                  currentCallRef.current = call;
                  const cc = getCallControlId(call as SdkCallLike);
                  setCallState("active");
                  setActiveCallId(cc || call.id || call.callId || null);
                  // L'audio remote est géré par le SDK (options.remoteStream ← track event,
                  // attaché au <audio id="telnyx-remote-audio">). On ne DUPLIQUE PAS WebRTC.
                  const stream: MediaStream | null = call.remoteStream || call.options?.remoteStream || null;
                  if (stream) setRemoteStream(stream);
                  if (call.direction === "inbound") {
                    logTag("CALL_INCOMING_MEDIA_CONNECTED", { callControlId: cc ?? "n/a", role: "incoming" });
                  }
                }
                // Foreign active → ignoré (tenant isolation).
              } else if (kind === "terminated") {
                if (mine) {
                  logTag("CALL_SDK_TERMINATED", { state: call.state });
                  resetPstnState(getCallControlId(call as SdkCallLike));
                } else {
                  unregisterSdkCall(call);
                }
              }
              break;
            }
            case "participantData": {
              // Événement Display : numéro / nom de l'appelant — uniquement notre appel.
              if (notification.displayNumber && call.direction === "inbound" && isMine(call)) {
                setIncomingCallerId(notification.displayName || notification.displayNumber);
              }
              break;
            }
            default:
              break;
          }
        });

        if (disposed) {
          try {
            client.disconnect();
          } catch {
            /* noop */
          }
          clientRef.current = null;
          return;
        }

        // Connect to Telnyx WebRTC
        client.connect();
      } catch (err) {
        console.error("Failed to initialize Telnyx:", err);
        if (!disposed) setRegistrationError("Connection failed");
      }
    };

    initTelnyx();

    // Fallback poller to catch missed hangup/destroy states from Telnyx SDK
    const poller = setInterval(() => {
      if (!currentCallRef.current) return;
      if (isTerminalSdkState(currentCallRef.current.state)) {
        const state = currentCallRef.current.state;
        console.log("[Telnyx Poller] Caught missed termination state:", state);
        setDebugLog((prev) => (prev ? `${prev} | poller -> ${state}` : `poller -> ${state}`));
        resetPstnState();
      }
    }, 1000);

    return () => {
      disposed = true;
      clearInterval(poller);
      if (clientRef.current) {
        try {
          clientRef.current.disconnect();
        } catch {
          /* noop */
        }
        clientRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Abonnement Pusher pour les appels PSTN entrants ──────────────────────
  // Le serveur publie pstn:incoming sur private-user-{userId} quand un appel
  // PSTN arrive et qu'aucun agent IA n'est assigné au numéro. Le client affiche
  // l'UI d'appel entrant ; le média, lui, vient du SDK Telnyx (call.answer()).
  useEffect(() => {
    const userId = session?.user?.id;
    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
    if (!userId || !pusherKey) return;

    const pusher = new Pusher(pusherKey, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "eu",
      channelAuthorization: {
        endpoint: "/api/pusher/auth",
        transport: "ajax",
      },
    });

    const channel = pusher.subscribe(appCallChannels.user(userId));

    channel.bind("pusher:subscription_succeeded", () => {
      console.log("[TelnyxContext] Pusher channel subscribed:", appCallChannels.user(userId));
    });

    channel.bind(PSTN_EVENTS.INCOMING, (data: any) => {
      console.log(`[CALL_INCOMING_PUSHER_RECEIVED] ${data.callControlId} user=${userId}`);

      // Dup/replay + état non-idle → ignoré (double listener, etc.)
      const cc = data.callControlId;
      if (!cc || consumedRef.current.has(cc) || callStateRef.current !== "idle") {
        console.warn(`[TelnyxContext] PSTN INCOMING ignoré — state=${callStateRef.current}`);
        return;
      }

      // Afficher l'UI d'appel entrant
      setPstnCallControlId(cc);
      pstnCallControlIdRef.current = cc;
      setCallState("ringing");
      setCallDirection("inbound");
      setIncomingCallerId(data.callerName || data.from || "Appel entrant");

      // Ordre B possible : le Call SDK est arrivé AVANT Pusher. On le lie AUJOURD'HUI
      // (uniquement par corrélation EXACTE — jamais "le dernier Call entrant").
      const sdkCall = findCorrelatedSdkCall(cc);
      if (sdkCall) {
        currentCallRef.current = sdkCall;
        registerSdkCall(sdkCall);
        console.log(`[CALL_INCOMING_SDK_LINKED] ${cc}`);
      }
      console.log(`[CALL_INCOMING_UI_SHOWN] ${cc}`);
    });

    channel.bind(PSTN_EVENTS.ENDED, (data: any) => {
      // Ne ferme QUE l'appel courant : `shouldEndIncoming` garantit qu'un
      // pstn:ended(ABC) ne ferme JAMAIS un nouvel appel DEF (ref = état courant).
      const endedCc = data.callControlId;
      const currentCc = pstnCallControlIdRef.current;
      if (shouldEndIncoming(endedCc, currentCc)) {
        console.log(`[CALL_INCOMING_ENDED] ${endedCc}`);
        resetPstnState(endedCc);
      }
    });

    // ── Reconcilation (scénario I) : page ouverte APRÈS l'arrivée de l'appel ──
    // Retrouve un appel entrant INITIATED routé vers cet utilisateur. Elle ne crée
    // JAMAIS d'état ACTIVE : seules les notifications SDK le déclarent.
    (async () => {
      try {
        const res = await fetch("/api/telnyx/active-call");
        if (!res.ok) return;
        const body = await res.json();
        const incoming = body?.call;
        if (incoming?.callControlId && callStateRef.current === "idle") {
          if (consumedRef.current.has(incoming.callControlId)) return;
          setPstnCallControlId(incoming.callControlId);
          pstnCallControlIdRef.current = incoming.callControlId;
          setCallState("ringing");
          setCallDirection("inbound");
          setIncomingCallerId(incoming.callerName || incoming.from || "Appel entrant");
          const sdkCall = findCorrelatedSdkCall(incoming.callControlId);
          if (sdkCall) {
            currentCallRef.current = sdkCall;
            registerSdkCall(sdkCall);
          }
          console.log(`[CALL_INCOMING_UI_SHOWN] ${incoming.callControlId} (reconciliation)`);
        }
      } catch {
        // La reconcilation est best-effort : le flux Pusher reste le canal principal.
      }
    })();

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(appCallChannels.user(userId));
      pusher.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  const makeCall = async (destination: string, callerId?: string) => {
    if (!clientRef.current || !isRegistered) {
      toast.error("Le téléphone n'est pas encore connecté au réseau.");
      return;
    }

    // Check Microphone permissions explicitly before making the call
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      console.error("Microphone access denied");
      toast.error("Veuillez autoriser l'accès au microphone dans votre navigateur pour passer des appels.");
      return;
    }

    try {
      let cleanDestination = destination.replace(/[^0-9+]/g, "");

      // Force E.164 formatting
      if (cleanDestination.length === 10 && !cleanDestination.startsWith("+")) {
        cleanDestination = "+1" + cleanDestination;
      } else if (cleanDestination.length > 10 && !cleanDestination.startsWith("+")) {
        cleanDestination = "+" + cleanDestination;
      }

      const call = clientRef.current.newCall({
        destinationNumber: cleanDestination,
        callerNumber: callerId || undefined, // Pass the selected Caller ID here, or undefined if empty
        audio: true,
        video: false,
      });

      if (!call) {
        throw new Error("L'intégration Telnyx n'a pas pu créer l'appel.");
      }

      currentCallRef.current = call;
      registerSdkCall(call);
      setIncomingCallerId(cleanDestination);
      setCallDirection("outbound");
      setCallState("ringing");
    } catch (err: any) {
      console.error("Failed to make call", err);
      setCallState("idle");
      toast.error(`Erreur: ${err?.message || err || "Vérifiez le format du numéro."}`);
    }
  };

  /** Réponse via le SDK : seul chemin qui établit réellement le média navigateur. */
  const answerViaSdk = useCallback(
    async (cc: string, call: any) => {
      setCallState("connecting");
      setActiveCallId(cc);
      console.log(`[CALL_INCOMING_ACCEPTED_SDK] ${cc}`);
      try {
        await call.answer();
        // PAS d'ACTIVE ici : l'état ACTIVE est déclaré UNIQUEMENT par la
        // notification SDK `state === 'active'` (callUpdate).
        // Le SDK gère le média (remoteStream → <audio> remoteElement + play()).
        // await call.answer() ne se résout pas toujours à la création du média ;
        // on arme quand même un garde-média (alerte si rien d'ACTIVE pendant X ms).
        window.setTimeout(() => {
          if (callStateRef.current === "connecting" && pstnCallControlIdRef.current === cc) {
            toast.warning("Appel connecté — aucun flux média reçu, vérifiez haut-parleur / micro.");
          }
        }, MEDIA_WARNING_MS);
      } catch (err: any) {
        console.error("[TelnyxContext] SDK answer() failed:", err);
        // Garde serveur : le SDK est corrélé mais answer() a échoué. On répond en
        // Call Control pour ne pas laisser sonner à l'infini. ACTIVE restera piloté
        // par le SDK (ou restera en 'connecting' + alerte honnête, jamais un faux ACTIVE).
        try {
          const res = await fetch("/api/telnyx/answer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ callControlId: cc }),
          });
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || `HTTP ${res.status}`);
          }
          console.log(`[CALL_INCOMING_GUARD_ANSWER] ${cc} (server guard, media via SDK pending)`);
          window.setTimeout(() => {
            if (callStateRef.current === "connecting" && pstnCallControlIdRef.current === cc) {
              toast.warning("Appel connecté côté serveur — aucun média reçu, vérifiez le téléphone WebRTC.");
            }
          }, MEDIA_WARNING_MS);
        } catch (apiErr: any) {
          console.error("[TelnyxContext] guard answer failed:", apiErr);
          toast.error(`Erreur décrochage: ${apiErr.message}`);
          resetPstnState(cc);
        }
      }
    },
    [resetPstnState],
  );

  const answerCall = useCallback(async () => {
    if (callStateRef.current !== "ringing") return;
    // Garde double-Accept (un seul answer()).
    if (acceptInFlightRef.current) return;
    acceptInFlightRef.current = true;
    const generation = waitGenerationRef.current;
    try {
      const cc = pstnCallControlIdRef.current;
      if (!cc) return;

      const { action } = decideAcceptAction({
        callState: callStateRef.current,
        expectedCallControlId: cc,
        sdkCall: findCorrelatedSdkCall(cc),
        alreadyAnswered: !!cc && consumedRef.current.has(cc),
        sdkAnswerFailed: false,
        stale: false,
        waitExpired: false,
      });

      if (action === "refuse-no-context") return;

      if (action === "wait-for-sdk") {
        // Ordre A possible : Pusher d'abord, Call SDK ensuite (ou l'id pas encore peuplé).
        // On attend UNIQUEMENT un Call corrélé — jamais "le dernier Call entrant".
        setCallState("connecting");
        setActiveCallId(cc ?? null);
        await new Promise<void>((resolve) => {
          const started = nowTs();
          const found = () => {
            if (callStateRef.current !== "connecting" || pstnCallControlIdRef.current !== cc) {
              resolve(); // cancelled (ended/reject while waiting)
              return true;
            }
            const call = findCorrelatedSdkCall(cc);
            if (cc && call) {
              void answerViaSdk(cc, call);
              resolve();
              return true;
            }
            if (nowTs() - started >= SDK_WAIT_TIMEOUT_MS) {
              resolve();
              return true;
            }
            return false;
          };
          if (found()) return;
          const timer = window.setInterval(() => {
            if (found()) {
              window.clearInterval(timer);
            }
          }, SDK_WAIT_POLL_MS);
        });
        const stillConnecting =
          (callStateRef.current as CallState) === "connecting" && pstnCallControlIdRef.current === cc;
        if (stillConnecting) {
          // Timeout sans Call SDK corrélé : on NE répond PAS via l'API (un 200 Call
          // Control = zéro média navigateur). On revient en sonnerie, l'utilisateur
          // peut retenter ou refuser.
          setCallState("ringing");
          toast.error("Téléphone WebRTC non joignable — impossible d'établir l'audio. Réessayez ou refusez.");
        }
        return;
      }

      if (action === "sdk-answer") {
        const call = findCorrelatedSdkCall(cc);
        if (cc && call) {
          await answerViaSdk(cc, call);
        }
        return;
      }

      if (action === "guard-api-answer") {
        const call = findCorrelatedSdkCall(cc);
        if (cc) await answerViaSdk(cc, call); // answerViaSdk gère déjà le fallback serveur si answer() échoue
        return;
      }
    } finally {
      if (waitGenerationRef.current === generation) {
        acceptInFlightRef.current = false;
      }
    }
  }, [answerViaSdk, findCorrelatedSdkCall, resetPstnState]);

  const rejectCall = useCallback(async () => {
    if (callStateRef.current !== "ringing") return;
    const cc = pstnCallControlIdRef.current;

    // 1) Call SDK corrélé → on le raccroche côté navigateur (arrête la sonnerie).
    const sdkCall = findCorrelatedSdkCall(cc);
    if (sdkCall) {
      try {
        await sdkCall.hangup();
      } catch (e) {
        console.error("Error hanging up call on reject:", e);
      }
    }
    // 2) Garde serveur : garantit que la leg Telnyx est clôturée (best effort).
    if (cc) {
      try {
        await fetch("/api/telnyx/hangup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ callControlId: cc }),
        });
      } catch {
        // best effort
      }
    }
    resetPstnState(cc);
  }, [findCorrelatedSdkCall, resetPstnState]);

  const hangupCall = useCallback(async () => {
    const cc = pstnCallControlIdRef.current;
    // 1) Call SDK corrélé (ou outbound) → hangup() = teardown média + signaling.
    const sdkCall = findCorrelatedSdkCall(cc) || currentCallRef.current;
    if (sdkCall) {
      try {
        await sdkCall.hangup();
      } catch (e) {
        console.error("Error hanging up call:", e);
      }
    }
    // 2) Garde serveur : leg Telnyx (best effort, idempotent côté webhook/409).
    if (cc) {
      try {
        await fetch("/api/telnyx/hangup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ callControlId: cc }),
        });
      } catch {
        // best effort
      }
    }
    // Reset immédiat de l'UI (un pstn:ended éventuel est un double reset idempotent).
    resetPstnState(cc);
  }, [findCorrelatedSdkCall, resetPstnState]);

  const muteMicrophone = (muted: boolean) => {
    if (currentCallRef.current) {
      if (muted) {
        currentCallRef.current.muteAudio();
      } else {
        currentCallRef.current.unmuteAudio();
      }
    }
  };

  const sendDTMF = (digit: string) => {
    if (currentCallRef.current && callState === "active") {
      currentCallRef.current.dtmf(digit);
    }
  };

  /** Débloque l'autoplay (geste utilisateur) si le navigateur l'a bloqué.
   *  Le SDK a déjà attaché remoteStream au <audio id="telnyx-remote-audio">. */
  const requestAudioUnlock = useCallback(() => {
    const el = document.getElementById("telnyx-remote-audio") as HTMLAudioElement | null;
    if (el) {
      el.play().catch(() => {
        /* l'utilisateur devra réessayer (UI reste visible) */
      });
    }
  }, []);

  return (
    <TelnyxContext.Provider
      value={{
        isRegistered,
        registrationError,
        callState,
        callDirection,
        activeCallId,
        incomingCallerId,
        remoteStream,
        makeCall,
        answerCall,
        rejectCall,
        hangupCall,
        muteMicrophone,
        sendDTMF,
        requestAudioUnlock,
        debugLog, // Expose debug log
      }}
    >
      {/* Hidden audio element required for Telnyx to attach the remote stream */}
      <audio id="telnyx-remote-audio" autoPlay className="hidden" />
      {children}
    </TelnyxContext.Provider>
  );
};