export type CallRouteType = "APP_TO_APP" | "APP_TO_PSTN";

export interface CallRoute {
  type: CallRouteType;
  destination: string;
}

export type CallErrorCode =
  | "UNAUTHORIZED"
  | "NO_ORGANIZATION"
  | "SELF_CALL"
  | "TARGET_NOT_CALLABLE"
  | "AMBIGUOUS_INTERNAL_TARGET"
  | "EMPTY_TARGET"
  | "NOT_APP_TO_APP_DESTINATION"
  | "CALLEE_NOT_FOUND"
  | "MAX_CONCURRENT_CALLS"
  | "MAX_CALLS_PER_HOUR"
  | "MAX_CALLS_PER_DAY"
  | "CALLEE_BUSY"
  | "CALLER_BUSY"
  | "ORGANIZATION_MAX_CONCURRENT"
  | "SERIALIZATION_CONFLICT"
  | "NO_PLAN"
  | "PLAN_INACTIVE";

export type CallDirection = "inbound" | "outbound";

export type PstnCallState = "idle" | "ringing" | "connecting" | "active" | "held" | "error";

export type AppCallStatus =
  | "idle"
  | "OFFERING"
  | "RINGING"
  | "CONNECTING"
  | "ACTIVE"
  | "ENDED"
  | "MISSED"
  | "DECLINED"
  | "FAILED";

export type PhoneTab = "favorites" | "recents" | "contacts" | "dialer" | "messages";

export interface PhoneContact {
  id: string;
  name?: string | null;
  company?: string | null;
  email?: string | null;
  phone: string;
  isVip?: boolean;
  totalSpent?: number;
  purchaseCount?: number;
}

export interface PhoneCall {
  id: string;
  direction?: string | null;
  status?: string | null;
  fromNumber?: string | null;
  toNumber?: string | null;
  startedAt?: string | Date | null;
  duration?: number | null;
}

export interface PhoneVoicemail {
  id: string;
  fromNumber?: string | null;
  toNumber?: string | null;
  startedAt?: string | Date | null;
  duration?: number | null;
  transcriptionText?: string | null;
  audioUrl: string;
}

export interface DirectoryUser {
  id: string;
  name: string | null;
  callUsername: string | null;
  callExtension: string | null;
  email: string | null;
}
