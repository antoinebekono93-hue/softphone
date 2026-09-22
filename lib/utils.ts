/**
 * Utility functions shared across the application.
 */

/**
 * Formats a currency amount.
 */
export function formatCurrency(amount: number, currency: string = "EUR"): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency,
  }).format(amount);
}

/**
 * Formats a phone number string into a human-readable format.
 * Handles E.164 format (+1XXXXXXXXXX) and plain digits.
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");

  if (cleaned.length === 11 && cleaned.startsWith("1")) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }

  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  // International format — just add + and spaces
  if (cleaned.length > 10) {
    return `+${cleaned.slice(0, cleaned.length - 10)} ${cleaned.slice(-10, -7)} ${cleaned.slice(-7, -4)} ${cleaned.slice(-4)}`;
  }

  return phone;
}

/**
 * Formats a duration in seconds to mm:ss or hh:mm:ss.
 */
export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const pad = (n: number) => n.toString().padStart(2, "0");

  if (hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

/**
 * Formats a date relative to now (e.g., "2 min ago", "Yesterday").
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay} days ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

/**
 * Coerce a date-like value into a valid Date, or null when the value is absent
 * or invalid (never returns an "Invalid Date").
 */
function toValidDate(value: Date | string | number | null | undefined): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

const DATE_FULL = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
});

const DATE_FULL_YEAR = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const TIME = new Intl.DateTimeFormat("fr-FR", {
  hour: "2-digit",
  minute: "2-digit",
});

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Formats a date in French. Same day -> "Aujourd'hui", yesterday -> "Hier",
 * otherwise a French date ("21 sept." or "21 sept. 2026").
 * Returns "Date indisponible" only when the value is absent or invalid.
 */
export function formatDateFR(value: Date | string | number | null | undefined): string {
  const date = toValidDate(value);
  if (!date) return "Date indisponible";
  const now = new Date();

  if (isSameDay(date, now)) return "Aujourd'hui";
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(date, yesterday)) return "Hier";

  if (date.getFullYear() === now.getFullYear()) {
    return DATE_FULL.format(date);
  }
  return DATE_FULL_YEAR.format(date);
}

/**
 * Formats a time in French 24h format ("14:32").
 * Returns "Date indisponible" only when the value is absent or invalid.
 */
export function formatTimeFR(value: Date | string | number | null | undefined): string {
  const date = toValidDate(value);
  if (!date) return "Date indisponible";
  return TIME.format(date);
}

/**
 * Formats a date + time in French ("Aujourd'hui, 14:32", "Hier, 09:05",
 * "21 sept., 14:32", "21 sept. 2026, 14:32").
 * Returns "Date indisponible" only when the value is absent or invalid.
 */
export function formatDateTimeFR(value: Date | string | number | null | undefined): string {
  const date = toValidDate(value);
  if (!date) return "Date indisponible";
  return `${formatDateFR(date)}, ${formatTimeFR(date)}`;
}

/**
 * Normalizes a phone number to E.164 format.
 * Assumes North American numbers if no country code is provided.
 */
export function toE164(phone: string, defaultCountryCode = "1"): string {
  const cleaned = phone.replace(/\D/g, "");

  if (cleaned.startsWith(defaultCountryCode) && cleaned.length === 11) {
    return `+${cleaned}`;
  }

  if (cleaned.length === 10) {
    return `+${defaultCountryCode}${cleaned}`;
  }

  // Already looks international
  if (cleaned.length > 10) {
    return `+${cleaned}`;
  }

  return `+${cleaned}`;
}

/**
 * Generates a random string for identifiers.
 */
export function generateId(length = 16): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    result += chars[array[i] % chars.length];
  }
  return result;
}

/**
 * Classname merge utility — concatenates truthy class names.
 */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Delays execution for a given number of milliseconds.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Plan feature limits lookup.
 */
export type Plan = "STARTER" | "PRO" | "ENTERPRISE";

export interface PlanLimits {
  maxUsers: number;
  maxPhoneNumbers: number;
  maxMinutesPerMonth: number;
  callHistoryDays: number;
  hasRecording: boolean;
  hasTransfer: boolean;
  hasAdvancedAnalytics: boolean;
}

const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  STARTER: {
    maxUsers: 1,
    maxPhoneNumbers: 1,
    maxMinutesPerMonth: 500,
    callHistoryDays: 30,
    hasRecording: false,
    hasTransfer: false,
    hasAdvancedAnalytics: false,
  },
  PRO: {
    maxUsers: 5,
    maxPhoneNumbers: 3,
    maxMinutesPerMonth: 2000,
    callHistoryDays: 90,
    hasRecording: true,
    hasTransfer: true,
    hasAdvancedAnalytics: true,
  },
  ENTERPRISE: {
    maxUsers: 999,
    maxPhoneNumbers: 10,
    maxMinutesPerMonth: 10000,
    callHistoryDays: 365,
    hasRecording: true,
    hasTransfer: true,
    hasAdvancedAnalytics: true,
  },
};

export function getPlanLimits(plan: Plan): PlanLimits {
  return PLAN_LIMITS[plan];
}
