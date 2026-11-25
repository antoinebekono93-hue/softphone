import { API_BASE_URL, apiUrl } from "./config";

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export interface ApiRequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  timeoutMs?: number;
}

export interface ApiClient {
  request<T>(path: string, options?: ApiRequestOptions): Promise<T>;
  get<T>(path: string, options?: Omit<ApiRequestOptions, "method" | "body">): Promise<T>;
  post<T>(path: string, body?: unknown, options?: Omit<ApiRequestOptions, "method" | "body">): Promise<T>;
}

export interface ApiClientOptions {
  baseUrl?: string;
  getToken?: () => Promise<string | null> | string | null;
  defaultTimeoutMs?: number;
}

export function createApiClient(options: ApiClientOptions = {}): ApiClient {
  const baseUrl = (options.baseUrl ?? API_BASE_URL).replace(/\/+$/, "");
  const defaultTimeoutMs = options.defaultTimeoutMs ?? 15000;

  async function request<T>(path: string, req: ApiRequestOptions = {}): Promise<T> {
    if (!baseUrl) {
      throw new ApiError("API base URL is not configured", 0, "NO_BASE_URL");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), req.timeoutMs ?? defaultTimeoutMs);
    const abortFromCaller = () => controller.abort();
    req.signal?.addEventListener("abort", abortFromCaller);

    const token = options.getToken ? await options.getToken() : null;

    try {
      const response = await fetch(`${baseUrl}${path.startsWith("/") ? path : `/${path}`}`, {
        method: req.method ?? "GET",
        headers: {
          Accept: "application/json",
          ...(req.body !== undefined ? { "Content-Type": "application/json" } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...req.headers,
        },
        body: req.body !== undefined ? JSON.stringify(req.body) : undefined,
        signal: controller.signal,
      });

      const text = await response.text();
      const payload = text ? safeJsonParse(text) : null;

      if (!response.ok) {
        const code =
          payload && typeof payload === "object" && "error" in payload
            ? String((payload as { error?: unknown }).error ?? "")
            : undefined;
        throw new ApiError(code || `Request failed (${response.status})`, response.status, code);
      }

      return payload as T;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (isAbortError(error)) {
        throw new ApiError("Request timed out", 0, "TIMEOUT");
      }
      throw new ApiError("Network request failed", 0, "NETWORK");
    } finally {
      clearTimeout(timeout);
      req.signal?.removeEventListener("abort", abortFromCaller);
    }
  }

  return {
    request,
    get: (path, opts) => request(path, { ...opts, method: "GET" }),
    post: (path, body, opts) => request(path, { ...opts, method: "POST", body }),
  };
}

function isAbortError(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { name?: unknown }).name === "AbortError";
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export { apiUrl };
