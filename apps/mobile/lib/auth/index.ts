import { MOCK_AUTH_ENABLED } from "../config";
import { MockAuthAdapter, UnconfiguredAuthAdapter } from "./adapters";
import type { AuthAdapter } from "./types";

export type { AuthAdapter, AuthSession, SessionUser, SignInCredentials } from "./types";
export { sessionStore } from "./session-store";
export { MockAuthAdapter, UnconfiguredAuthAdapter } from "./adapters";

export const authAdapter: AuthAdapter = MOCK_AUTH_ENABLED
  ? new MockAuthAdapter()
  : new UnconfiguredAuthAdapter();
