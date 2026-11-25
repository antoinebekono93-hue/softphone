export interface SessionUser {
  id: string;
  email: string | null;
  name: string | null;
  organizationId?: string | null;
  role?: string | null;
}

export interface AuthSession {
  user: SessionUser;
  accessToken?: string | null;
  expiresAt?: number | null;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface AuthAdapter {
  getSession(): Promise<AuthSession | null>;
  signIn(credentials: SignInCredentials): Promise<AuthSession>;
  signOut(): Promise<void>;
}
