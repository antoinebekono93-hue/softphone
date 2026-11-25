import { useMemo, useReducer } from "react";
import { activeCallReducer, createInitialUiState } from "@/lib/call/active-call-reducer";
import type { NativeCallPresentationState } from "@/lib/call/presentation";

export function useMockActiveCall(initial: NativeCallPresentationState) {
  const [ui, dispatch] = useReducer(activeCallReducer, initial, createInitialUiState);

  const actions = useMemo(
    () => ({
      toggleMute: () => dispatch({ type: "TOGGLE_MUTE" }),
      toggleSpeaker: () => dispatch({ type: "TOGGLE_SPEAKER" }),
      openKeypad: () => dispatch({ type: "OPEN_KEYPAD" }),
      closeKeypad: () => dispatch({ type: "CLOSE_KEYPAD" }),
      hangup: () => dispatch({ type: "HANGUP" }),
      reset: () => dispatch({ type: "RESET", call: initial }),
      setCall: (call: NativeCallPresentationState) => dispatch({ type: "SET_CALL", call }),
    }),
    [initial],
  );

  return { call: ui.call, keypadOpen: ui.keypadOpen, actions };
}
