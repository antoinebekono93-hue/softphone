import { canonicalizePhoneNumber, phoneNumberLookupCandidates } from '@/lib/phone-number';
import { AIToolError } from './errors';

const MAX_FIELD = 120;
const MIN_QUERY = 2;
const MAX_QUERY = 80;
const MAX_LIMIT = 10;
const DEFAULT_LIMIT = 5;

function invalid(field: string): never {
  throw new AIToolError('INVALID_ARGUMENTS', `Invalid argument: ${field}`);
}

/**
 * Tool arguments arrive from Telnyx either as an object or as a JSON string.
 * The result is always a plain object; arrays, primitives and malformed JSON
 * are rejected so a tool can never treat a list as a record set.
 */
export function asArgumentsObject(raw: unknown): Record<string, unknown> {
  if (raw === null || raw === undefined) return {};
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return {};
    if (trimmed.length > 4000) invalid('arguments');
    try {
      const parsed: unknown = JSON.parse(trimmed);
      return asArgumentsObject(parsed);
    } catch {
      return invalid('arguments');
    }
  }
  if (typeof raw !== 'object' || Array.isArray(raw)) invalid('arguments');
  return raw as Record<string, unknown>;
}

export function rejectUnknownKeys(
  args: Record<string, unknown>,
  allowed: readonly string[]
): void {
  for (const key of Object.keys(args)) {
    if (!allowed.includes(key)) invalid(key);
  }
}

export function readRequiredString(
  args: Record<string, unknown>,
  key: string,
  max = MAX_FIELD
): string {
  const value = args[key];
  if (typeof value !== 'string') invalid(key);
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > max) invalid(key);
  return trimmed;
}

export function readOptionalString(
  args: Record<string, unknown>,
  key: string,
  max = MAX_FIELD
): string | undefined {
  const value = args[key];
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string') invalid(key);
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > max) invalid(key);
  return trimmed;
}

export function readOptionalEnum<T extends string>(
  args: Record<string, unknown>,
  key: string,
  allowed: readonly T[]
): T | undefined {
  const value = args[key];
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string' || !allowed.includes(value as T)) invalid(key);
  return value as T;
}

export function readSearchQuery(
  args: Record<string, unknown>,
  key: string
): string {
  const value = readRequiredString(args, key, MAX_QUERY);
  if (value.length < MIN_QUERY) invalid(key);
  return value;
}

export function readLimit(
  args: Record<string, unknown>,
  key: string
): number {
  const value = args[key];
  if (value === undefined || value === null || value === '') return DEFAULT_LIMIT;
  const parsed = typeof value === 'string' ? Number(value) : value;
  if (
    typeof parsed !== 'number' ||
    !Number.isInteger(parsed) ||
    parsed < 1 ||
    parsed > MAX_LIMIT
  ) {
    invalid(key);
  }
  return parsed;
}

export interface NormalizedPhone {
  canonical: string;
  candidates: string[];
}

export function readPhone(
  args: Record<string, unknown>,
  key: string
): NormalizedPhone {
  if (typeof args[key] !== 'string') invalid(key);
  const candidates = phoneNumberLookupCandidates(args[key]);
  const canonical = canonicalizePhoneNumber(args[key]);
  if (!canonical || candidates.length === 0) invalid(key);
  return { canonical, candidates };
}
