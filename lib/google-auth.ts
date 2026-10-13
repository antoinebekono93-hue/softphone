export type GoogleAuthStatus = "idle" | "loading" | "error";

/** User-facing copy. Raw Nhost/OAuth errors are never surfaced. */
export const GOOGLE_AUTH_ERROR_MESSAGE =
  "Google sign-in could not be completed. Please try again.";

/**
 * Gate that prevents duplicate OAuth starts (double click / fast tap / retry
 * while the first redirect is in flight).
 */
export function canStartGoogleAuth(
  status: GoogleAuthStatus,
  disabled: boolean
): boolean {
  return !disabled && status !== "loading";
}
