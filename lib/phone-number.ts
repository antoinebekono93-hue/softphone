import { parsePhoneNumberFromString } from "libphonenumber-js";

/**
 * Canonical telephone identity used at application boundaries.
 *
 * PhoneNumber.number is a globally-unique, provider-backed identifier.  We
 * therefore never persist presentation formats such as `00237 612 345 678`:
 * all newly written values must be strict E.164 (`+237612345678`).
 *
 * A bare number is accepted only when its country can be determined without
 * guessing: Cameroon (the supported +237 flow), NANP with an explicit leading
 * 1, or the legacy ten-digit NANP input.  The browser Dialpad normally sends
 * E.164 already, so rejecting other bare international strings is intentional.
 */
export function canonicalizePhoneNumber(raw: unknown): string | null {
  if (typeof raw !== "string") return null;

  let value = raw.trim();
  if (!value) return null;

  // Keep only common human-readable separators.  Any other character (for
  // example an extension marker) makes the value unsuitable as a phone identity.
  if (/[^0-9+().\s-]/.test(value)) return null;
  value = value.replace(/[().\s-]/g, "");

  // International dialling prefix.  `00237…` and `+237…` must resolve to the
  // same platform identity.
  if (value.startsWith("00")) {
    value = `+${value.slice(2)}`;
  }

  if (!value.startsWith("+")) {
    if (!/^\d+$/.test(value)) return null;

    // Cameroon: country code 237 + a nine-digit national number.
    if (/^237\d{9}$/.test(value)) {
      value = `+${value}`;
    // Legacy UI behaviour: a 10-digit local NANP entry means +1.
    } else if (/^\d{10}$/.test(value)) {
      value = `+1${value}`;
    // Explicit NANP country code is unambiguous.
    } else if (/^1\d{10}$/.test(value)) {
      value = `+${value}`;
    } else {
      return null;
    }
  }

  if (!/^\+[1-9]\d{1,14}$/.test(value)) return null;

  const parsed = parsePhoneNumberFromString(value);
  if (!parsed?.isValid()) return null;

  // `number` is already E.164.  Retain the explicit shape guard in case a
  // future dependency upgrade changes its return type.
  return /^\+[1-9]\d{1,14}$/.test(parsed.number) ? parsed.number : null;
}

/**
 * Candidates for a safe database lookup during the transition from legacy
 * storage.  New writes always use the first (canonical) candidate; the
 * remaining values merely let existing `237…` / `00237…` rows be recognized
 * until they are naturally rewritten through an administrative action.
 */
export function phoneNumberLookupCandidates(raw: unknown): string[] {
  const canonical = canonicalizePhoneNumber(raw);
  if (!canonical) return [];

  const digits = canonical.slice(1);
  const candidates = [canonical, digits, `00${digits}`];

  // Earlier UI versions allowed US users to save a local ten-digit value.
  if (canonical.startsWith("+1") && digits.length === 11) {
    candidates.push(digits.slice(1));
  }

  return [...new Set(candidates)];
}
