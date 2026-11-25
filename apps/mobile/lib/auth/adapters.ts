import type { AuthAdapter, AuthSession, SignInCredentials } from "./types";
import { sessionStore } from "./session-store";

const MOCK_SESSION: AuthSession = {
  user: {
    id: "mock-user",
    email: "demo@bustercall.test",
    name: "Compte de démonstration",
    organizationId: "mock-org",
    role: "USER",
  },
  accessToken: null,
  expiresAt: null,
};

export class MockAuthAdapter implements AuthAdapter {
  async getSession(): Promise<AuthSession | null> {
    return (await sessionStore.load()) ?? null;
  }

  async signIn(credentials: SignInCredentials): Promise<AuthSession> {
    const session: AuthSession = {
      ...MOCK_SESSION,
      user: { ...MOCK_SESSION.user, email: credentials.email },
    };
    await sessionStore.save(session);
    return session;
  }

  async signOut(): Promise<void> {
    await sessionStore.clear();
  }
}

export class UnconfiguredAuthAdapter implements AuthAdapter {
  async getSession(): Promise<AuthSession | null> {
    return sessionStore.load();
  }

  async signIn(): Promise<AuthSession> {
    throw new Error(
      "Native sign-in is not wired yet. The web app uses NextAuth (JWT). " +
        "Enable EXPO_PUBLIC_MOCK_AUTH=true for local UI work.",
    );
  }

  async signOut(): Promise<void> {
    await sessionStore.clear();
  }
}
