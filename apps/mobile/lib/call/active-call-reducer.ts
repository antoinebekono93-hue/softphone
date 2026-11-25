import type { NativeCallPresentationState, NativeCallStatus } from "./presentation";

export interface ActiveCallUiState {
  call: NativeCallPresentationState;
  keypadOpen: boolean;
}

export type ActiveCallAction =
  | { type: "SET_STATUS"; status: NativeCallStatus; startedAt?: number | null; failureReason?: string | null }
  | { type: "SET_CALL"; call: NativeCallPresentationState }
  | { type: "TOGGLE_MUTE" }
  | { type: "TOGGLE_SPEAKER" }
  | { type: "OPEN_KEYPAD" }
  | { type: "CLOSE_KEYPAD" }
  | { type: "HANGUP" }
  | { type: "RESET"; call?: NativeCallPresentationState };

export const IDLE_CALL: NativeCallPresentationState = {
  status: "IDLE",
  displayName: "",
  displayNumber: "",
  avatarUri: null,
  startedAt: null,
  muted: false,
  speaker: false,
  callType: undefined,
  failureReason: null,
};

export function createInitialUiState(call: NativeCallPresentationState = IDLE_CALL): ActiveCallUiState {
  return { call, keypadOpen: false };
}

export function activeCallReducer(
  state: ActiveCallUiState,
  action: ActiveCallAction,
): ActiveCallUiState {
  switch (action.type) {
    case "SET_STATUS": {
      const call: NativeCallPresentationState = { ...state.call, status: action.status };
      if ("startedAt" in action) call.startedAt = action.startedAt ?? null;
      if ("failureReason" in action) call.failureReason = action.failureReason ?? null;

      const terminal =
        action.status === "ENDED" || action.status === "FAILED" || action.status === "IDLE";
      if (terminal) {
        call.muted = false;
        call.speaker = false;
        call.startedAt = null;
      }
      return { call, keypadOpen: terminal ? false : state.keypadOpen };
    }
    case "SET_CALL":
      return { call: action.call, keypadOpen: false };
    case "TOGGLE_MUTE":
      return { ...state, call: { ...state.call, muted: !state.call.muted } };
    case "TOGGLE_SPEAKER":
      return { ...state, call: { ...state.call, speaker: !state.call.speaker } };
    case "OPEN_KEYPAD":
      return { ...state, keypadOpen: true };
    case "CLOSE_KEYPAD":
      return { ...state, keypadOpen: false };
    case "HANGUP":
      return {
        call: {
          ...state.call,
          status: "ENDED",
          startedAt: null,
          muted: false,
          speaker: false,
          failureReason: null,
        },
        keypadOpen: false,
      };
    case "RESET":
      return { call: action.call ?? IDLE_CALL, keypadOpen: false };
    default:
      return state;
  }
}
