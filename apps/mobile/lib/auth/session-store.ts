import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import type { AuthSession } from "./types";

const SESSION_KEY = "buster.session";

export interface SessionStore {
  load(): Promise<AuthSession | null>;
  save(session: AuthSession): Promise<void>;
  clear(): Promise<void>;
}

const memory = new Map<string, string>();

async function safeGet(key: string): Promise<string | null> {
  if (Platform.OS === "web") return memory.get(key) ?? null;
  return SecureStore.getItemAsync(key);
}

async function safeSet(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    memory.set(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function safeDelete(key: string): Promise<void> {
  if (Platform.OS === "web") {
    memory.delete(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export const sessionStore: SessionStore = {
  async load() {
    try {
      const raw = await safeGet(SESSION_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as AuthSession;
    } catch {
      return null;
    }
  },
  async save(session) {
    await safeSet(SESSION_KEY, JSON.stringify(session));
  },
  async clear() {
    await safeDelete(SESSION_KEY);
  },
};
