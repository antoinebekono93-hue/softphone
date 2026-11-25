const rawBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? "";

export const API_BASE_URL = rawBaseUrl.replace(/\/+$/, "");

export const MOCK_AUTH_ENABLED = process.env.EXPO_PUBLIC_MOCK_AUTH === "true";

export function apiUrl(path: string): string {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${suffix}`;
}

export function isApiConfigured(): boolean {
  return API_BASE_URL.length > 0;
}
