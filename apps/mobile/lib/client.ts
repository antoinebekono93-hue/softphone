import { createApiClient } from "./api";
import { sessionStore } from "./auth/session-store";

export const api = createApiClient({
  getToken: async () => {
    const session = await sessionStore.load();
    return session?.accessToken ?? null;
  },
});
