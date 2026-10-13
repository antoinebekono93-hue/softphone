export const DEFAULT_AUTH_REDIRECT = "/dashboard";

const INTERNAL_BASE = "https://internal.buster-call.invalid";

/**
 * Only internal Buster Call paths are accepted as post-auth destinations.
 *
 * Rejected:
 *  - absolute URLs ("https://evil.com", "http://evil.com")
 *  - protocol-relative URLs ("//evil.com" -> would resolve off-origin)
 *  - backslash variants ("/\\evil.com") used to bypass origin checks
 *  - encoded separators ("/%2F%2Fevil.com") used to smuggle a host
 *  - control characters and whitespace
 */
export function isSafeInternalPath(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const path = value.trim();
  if (path.length === 0) return false;
  if (!path.startsWith("/")) return false;
  if (path.startsWith("//") || path.startsWith("/\\")) return false;
  if (/[\s\u0000-\u001f]/.test(path)) return false;
  if (/^\/%(2f|5c)/i.test(path)) return false;

  try {
    const parsed = new URL(path, INTERNAL_BASE);
    // A relative path must not change the origin. `//host` or backslash tricks
    // that survive the checks above are caught here.
    return parsed.origin === INTERNAL_BASE;
  } catch {
    return false;
  }
}

export function sanitizeInternalRedirect(
  value: unknown,
  fallback: string = DEFAULT_AUTH_REDIRECT
): string {
  return isSafeInternalPath(value) ? value : fallback;
}
