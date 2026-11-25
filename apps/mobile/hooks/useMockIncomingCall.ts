import { useMemo, useReducer } from "react";
import {
  createInitialIncomingState,
  incomingCallReducer,
} from "@/lib/call/incoming-call-reducer";
import type { NativeCallPresentationState } from "@/lib/call/presentation";

export function useMockIncomingCall(initial: NativeCallPresentationState) {
  const [ui, dispatch] = useReducer(incomingCallReducer, initial, createInitialIncomingState);

  const actions = useMemo(
    () => ({
      accept: () => dispatch({ type: "ACCEPT" }),
      decline: () => dispatch({ type: "DECLINE" }),
      advanceConnecting: () => dispatch({ type: "ADVANCE_CONNECTING" }),
      advanceEnded: () => dispatch({ type: "ADVANCE_ENDED" }),
      markMissed: () => dispatch({ type: "MARK_MISSED" }),
      fail: (failureReason?: string | null) => dispatch({ type: "FAIL", failureReason }),
      dismiss: () => dispatch({ type: "DISMISS" }),
      reset: () => dispatch({ type: "RESET", call: initial }),
      setCall: (call: NativeCallPresentationState) => dispatch({ type: "SET_CALL", call }),
    }),
    [initial],
  );

  return { call: ui.call, actions };
}
