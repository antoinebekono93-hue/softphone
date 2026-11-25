import { AsYouType } from "libphonenumber-js";

export function digitsOnly(value?: string | null): string {
  return (value ?? "").replace(/\D/g, "");
}

/** A dialled value already carrying an explicit international prefix. */
export function isExplicitInternational(value: string): boolean {
  return /^00\d+$/.test(value) || /^237\d{9}$/.test(value);
}

/**
 * Outbound dialler composition, identical to the web dialer:
 * a value that is not already international is prefixed with the selected
 * country dial code (a single leading zero is dropped first).
 */
export function buildOutboundNumber(rawValue: string, dialCode: string): string {
  const raw = (rawValue ?? "").trim();
  if (!raw) return "";
  if (raw.startsWith("+")) return raw;
  if (isExplicitInternational(raw)) return raw;
  const national = raw.startsWith("0") ? raw.slice(1) : raw;
  return `${dialCode}${national}`;
}

/** As-you-type display formatting; falls back to the raw value when too short. */
export function formatDisplayNumber(rawValue: string, defaultIso?: string): string {
  if (!rawValue) return "";
  try {
    return new AsYouType(defaultIso as never).input(rawValue) || rawValue;
  } catch {
    return rawValue;
  }
}
