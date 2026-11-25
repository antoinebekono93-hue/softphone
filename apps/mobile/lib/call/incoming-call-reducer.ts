import type { NativeCallPresentationState } from "./presentation";
import { IDLE_CALL } from "./active-call-reducer";

export interface IncomingCallUiState {
  call: NativeCallPresentationState;
}

export type IncomingCallAction =
  | { type: "SET_CALL"; call: NativeCallPresentationState }
  | { type: "ACCEPT" }
  | { type: "DECLINE" }
  | { type: "ADVANCE_CONNECTING" }
  | { type: "ADVANCE_ENDED" }
  | { type: "MARK_MISSED" }
  | { type: "FAIL"; failureReason?: string | null }
  | { type: "DISMISS" }
  | { type: "RESET"; call?: NativeCallPresentationState };

export function createInitialIncomingState(
  call: NativeCallPresentationState = IDLE_CALL,
): IncomingCallUiState {
  return { call };
}

export function incomingCallReducer(
  state: IncomingCallUiState,
  action: IncomingCallAction,
): IncomingCallUiState {
  switch (action.type) {
    case "SET_CALL":
      return { call: action.call };
    case "ACCEPT":
      return state.call.status === "INCOMING"
        ? { call: { ...state.call, status: "ACCEPTING" } }
        : state;
    case "DECLINE":
      return state.call.status === "INCOMING"
        ? { call: { ...state.call, status: "DECLINING" } }
        : state;
    case "ADVANCE_CONNECTING":
      return state.call.status === "ACCEPTING"
        ? { call: { ...state.call, status: "CONNECTING" } }
        : state;
    case "ADVANCE_ENDED":
      return state.call.status === "DECLINING"
        ? { call: { ...state.call, status: "ENDED" } }
        : state;
    case "MARK_MISSED":
      return { call: { ...state.call, status: "MISSED" } };
    case "FAIL":
      return {
        call: { ...state.call, status: "FAILED", failureReason: action.failureReason ?? null },
      };
    case "DISMISS":
      return { call: IDLE_CALL };
    case "RESET":
      return { call: action.call ?? IDLE_CALL };
    default:
      return state;
  }
}
