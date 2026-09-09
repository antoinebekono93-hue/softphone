import { canonicalizePhoneNumber } from "@/lib/phone-number";
import metadataImport from "libphonenumber-js/metadata.max.json";

const phoneMetadata = ((metadataImport as any).default ?? metadataImport) as {
  countries: Record<string, [string, ...unknown[]]>;
  country_calling_codes: Record<string, string[]>;
};

export const INCOMING_ROUTING_MODES = ["APP", "FORWARD", "APP_THEN_FORWARD"] as const;
export type IncomingRoutingMode = (typeof INCOMING_ROUTING_MODES)[number];

export function incomingRouteInstruction(mode: IncomingRoutingMode) {
  return {
    notifyApp: mode !== "FORWARD",
    scheduleForward: mode === "APP_THEN_FORWARD",
    forwardImmediately: mode === "FORWARD",
  };
}

export function canManageIncomingRouting(params: {
  userId: string;
  userOrganizationId?: string | null;
  isSuperAdmin?: boolean;
  role?: string | null;
  numberOrganizationId: string;
  assignedUserId?: string | null;
}) {
  if (params.isSuperAdmin) return true;
  if (!params.userOrganizationId || params.userOrganizationId !== params.numberOrganizationId) return false;
  return params.role === "ADMIN" || params.role === "OWNER" || params.assignedUserId === params.userId;
}

export function clampForwardDuration(seconds: number) {
  return Math.max(60, Math.min(14400, Math.floor(seconds)));
}

export function normalizeIncomingRouting(input: unknown) {
  const body = input && typeof input === "object" ? input as Record<string, unknown> : {};
  const mode = typeof body.mode === "string" && INCOMING_ROUTING_MODES.includes(body.mode as IncomingRoutingMode)
    ? body.mode as IncomingRoutingMode
    : null;
  if (!mode) throw new Error("INVALID_ROUTING_MODE");
  const needsForward = mode !== "APP";
  const forwardToE164 = needsForward ? canonicalizePhoneNumber(body.forwardToE164) : null;
  if (needsForward && !forwardToE164) throw new Error("INVALID_FORWARD_DESTINATION");
  if (forwardToE164 && !/^\+[1-9]\d{6,14}$/.test(forwardToE164)) throw new Error("INVALID_FORWARD_DESTINATION");
  const seconds = Number(body.ringAppSeconds ?? 15);
  if (!Number.isInteger(seconds) || seconds < 5 || seconds > 60) throw new Error("INVALID_RING_SECONDS");
  return { mode, forwardToE164, ringAppSeconds: seconds, isEnabled: body.isEnabled !== false };
}

function tokens(value: string | null | undefined) {
  return String(value || "").split(/[\s,;]+/).map((item) => item.trim().toUpperCase()).filter(Boolean);
}

function callingCodeForCountry(country: string) {
  return phoneMetadata.countries[country]?.[0];
}

function countriesForDestination(destination: string) {
  const callingCode = Object.keys(phoneMetadata.country_calling_codes)
    .sort((a, b) => b.length - a.length)
    .find((code) => destination.startsWith(`+${code}`));
  return callingCode ? phoneMetadata.country_calling_codes[callingCode] : [];
}

function matchesRule(destination: string, countries: string[], rule: string) {
  if (rule === "*") return true;
  if (rule.startsWith("+")) return destination.startsWith(rule);
  return rule.length === 2 && countries.includes(rule);
}

export function evaluateForwardDestination(params: {
  destination: string;
  sourceCountry?: string | null;
  internationalEnabled: boolean;
  allowedDestinations?: string | null;
  blockedDestinations?: string | null;
}) {
  if (!/^\+[1-9]\d{6,14}$/.test(params.destination)) return { authorized: false, reason: "INVALID_FORWARD_DESTINATION" } as const;
  const countries = countriesForDestination(params.destination);
  if (countries.length === 0) return { authorized: false, reason: "INVALID_FORWARD_DESTINATION" } as const;
  if (tokens(params.blockedDestinations).some((rule) => matchesRule(params.destination, countries, rule))) {
    return { authorized: false, reason: "DESTINATION_BLOCKED" } as const;
  }
  const allowed = tokens(params.allowedDestinations);
  if (allowed.length && !allowed.some((rule) => matchesRule(params.destination, countries, rule))) {
    return { authorized: false, reason: "DESTINATION_NOT_ALLOWED" } as const;
  }
  const sourceCountry = params.sourceCountry?.toUpperCase();
  const sourceCallingCode = sourceCountry ? callingCodeForCountry(sourceCountry) : undefined;
  if (!params.internationalEnabled && sourceCallingCode && !params.destination.startsWith(`+${sourceCallingCode}`)) {
    return { authorized: false, reason: "INTERNATIONAL_DISABLED" } as const;
  }
  return { authorized: true, countries } as const;
}

export function wouldCreateForwardLoop(
  sourceNumber: string,
  destination: string,
  routes: Array<{ number: string; forwardToE164: string | null; incomingRoutingEnabled: boolean; incomingRoutingMode: string }>,
) {
  const source = canonicalizePhoneNumber(sourceNumber);
  let current = canonicalizePhoneNumber(destination);
  if (!source || !current) return true;
  const byNumber = new Map(routes.map((route) => [canonicalizePhoneNumber(route.number), route]));
  const visited = new Set<string>();
  for (let depth = 0; depth <= routes.length; depth++) {
    if (current === source || visited.has(current)) return true;
    visited.add(current);
    const route = byNumber.get(current);
    if (!route || !route.incomingRoutingEnabled || route.incomingRoutingMode === "APP" || !route.forwardToE164) return false;
    current = canonicalizePhoneNumber(route.forwardToE164);
    if (!current) return true;
  }
  return true;
}

export function shouldClaimForward(input: { callStatus: string; forwardStatus: string | null; dueAt: Date | null; now: Date }) {
  return ["INITIATED", "RINGING"].includes(input.callStatus) &&
    input.forwardStatus === "SCHEDULED" && Boolean(input.dueAt && input.dueAt <= input.now);
}
