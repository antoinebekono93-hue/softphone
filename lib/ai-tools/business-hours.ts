import { getZonedParts, zonedLocalToUtc } from './time';

/**
 * Logique PURE des horaires d'ouverture (Phase 4A.2). Aucun accès base : la
 * lecture des fenêtres vient du port `AppointmentWriter.getBusinessHours`, le
 * calcul de disponibilité est ici, entièrement testable sans base.
 *
 * Conventions :
 *  - `dayOfWeek` suit `Date.getDay()` : 0 = dimanche … 6 = samedi.
 *  - `opensAt`/`closesAt` sont des heures MURALES locales "HH:mm" dans le
 *    fuseau IANA résolu, jamais des instants UTC.
 *  - plusieurs fenêtres par jour sont autorisées ; un jour sans fenêtre est
 *    FERMÉ.
 *  - les fenêtres à cheval sur minuit sont REFUSÉES (`opensAt` < `closesAt`).
 *  - un rendez-vous doit être ENTIÈREMENT contenu dans UNE SEULE fenêtre.
 */

/** Enregistrement brut renvoyé par la couche d'accès (lignes `enabled` seules). */
export interface BusinessHoursWindowRecord {
  dayOfWeek: number;
  opensAt: string;
  closesAt: string;
}

export interface NormalizedBusinessHour {
  dayOfWeek: number;
  opensMinutes: number;
  closesMinutes: number;
}

export type BusinessHoursSource = 'EMPLOYEE' | 'ORGANIZATION';

export type ResolvedBusinessHours =
  | { configured: false; source: 'NONE'; windows: NormalizedBusinessHour[] }
  | {
      configured: true;
      source: BusinessHoursSource;
      windows: NormalizedBusinessHour[];
    };

export type BusinessHoursConfigRejection =
  | 'INVALID_DAY'
  | 'INVALID_TIME'
  | 'OVERNIGHT_NOT_SUPPORTED'
  | 'OVERLAPPING_WINDOWS';

export type BusinessHoursConfigValidation =
  | { ok: true; normalized: NormalizedBusinessHour[] }
  | { ok: false; reason: BusinessHoursConfigRejection };

const HM_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** "HH:mm" → minutes depuis minuit, ou null si le format est invalide. */
export function parseHm(value: unknown): number | null {
  if (typeof value !== 'string') return null;
  const match = HM_RE.exec(value);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function minutesToHm(minutes: number): string {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function isValidDayOfWeek(day: number): boolean {
  return Number.isInteger(day) && day >= 0 && day <= 6;
}

/**
 * Valide un lot de fenêtres (convention §17) : jour 0…6, "HH:mm" valide,
 * `opensAt` strictement antérieur à `closesAt` (pas de fenêtre nocturne), et
 * aucune fenêtre qui se chevauche pour un même jour (les fenêtres adjacentes
 * qui se touchent sont permises).
 */
export function validateBusinessHoursConfig(
  windows: readonly BusinessHoursWindowRecord[]
): BusinessHoursConfigValidation {
  const normalized: NormalizedBusinessHour[] = [];
  for (const window of windows) {
    if (!isValidDayOfWeek(window.dayOfWeek)) {
      return { ok: false, reason: 'INVALID_DAY' };
    }
    const opensMinutes = parseHm(window.opensAt);
    const closesMinutes = parseHm(window.closesAt);
    if (opensMinutes === null || closesMinutes === null) {
      return { ok: false, reason: 'INVALID_TIME' };
    }
    if (opensMinutes >= closesMinutes) {
      return { ok: false, reason: 'OVERNIGHT_NOT_SUPPORTED' };
    }
    normalized.push({
      dayOfWeek: window.dayOfWeek,
      opensMinutes,
      closesMinutes,
    });
  }

  for (let day = 0; day <= 6; day++) {
    const dayWindows = normalized
      .filter((window) => window.dayOfWeek === day)
      .sort((a, b) => a.opensMinutes - b.opensMinutes);
    for (let i = 1; i < dayWindows.length; i++) {
      if (dayWindows[i].opensMinutes < dayWindows[i - 1].closesMinutes) {
        return { ok: false, reason: 'OVERLAPPING_WINDOWS' };
      }
    }
  }

  return { ok: true, normalized };
}

function normalize(windows: readonly BusinessHoursWindowRecord[]): NormalizedBusinessHour[] {
  const result: NormalizedBusinessHour[] = [];
  for (const window of windows) {
    if (!isValidDayOfWeek(window.dayOfWeek)) continue;
    const opensMinutes = parseHm(window.opensAt);
    const closesMinutes = parseHm(window.closesAt);
    if (opensMinutes === null || closesMinutes === null) continue;
    if (opensMinutes >= closesMinutes) continue;
    result.push({
      dayOfWeek: window.dayOfWeek,
      opensMinutes,
      closesMinutes,
    });
  }
  return result;
}

/**
 * Hiérarchie de résolution (§12) : toute fenêtre spécifique employé REMPLACE
 * entièrement le défaut organisation ; sinon le défaut organisation ; sinon
 * AUCUNE configuration (comportement non restreint, décision A).
 */
export function resolveBusinessHours(sets: {
  employee: readonly BusinessHoursWindowRecord[];
  organization: readonly BusinessHoursWindowRecord[];
}): ResolvedBusinessHours {
  if (sets.employee.length > 0) {
    return {
      configured: true,
      source: 'EMPLOYEE',
      windows: normalize(sets.employee),
    };
  }
  if (sets.organization.length > 0) {
    return {
      configured: true,
      source: 'ORGANIZATION',
      windows: normalize(sets.organization),
    };
  }
  return { configured: false, source: 'NONE', windows: [] };
}

export type BusinessHoursReason =
  | 'CLOSED_DAY'
  | 'OUTSIDE_WINDOW'
  | 'SPANS_DAYS';

export interface BusinessHoursEvaluation {
  withinHours: boolean;
  reason?: BusinessHoursReason;
}

/**
 * Un rendez-vous est dans les heures ouvrées s'il commence et se termine le
 * MÊME jour local et qu'une fenêtre ouvrée de ce jour le contient entièrement
 * (`opensMinutes <= start && end <= closesMinutes`, borne de fermeture
 * inclusive). Un rendez-vous à cheval sur minuit ne peut jamais être contenu
 * (les fenêtres nocturnes sont refusées) → SPANS_DAYS.
 */
export function evaluateBusinessHours(params: {
  startsAt: Date;
  endsAt: Date;
  timezone: string;
  windows: readonly NormalizedBusinessHour[];
}): BusinessHoursEvaluation {
  const start = getZonedParts(params.startsAt, params.timezone);
  const end = getZonedParts(params.endsAt, params.timezone);

  if (
    start.year !== end.year ||
    start.month !== end.month ||
    start.day !== end.day
  ) {
    return { withinHours: false, reason: 'SPANS_DAYS' };
  }

  const dayWindows = params.windows.filter(
    (window) => window.dayOfWeek === start.dayOfWeek
  );
  if (dayWindows.length === 0) {
    return { withinHours: false, reason: 'CLOSED_DAY' };
  }

  const fit = dayWindows.some(
    (window) =>
      start.minutesOfDay >= window.opensMinutes &&
      end.minutesOfDay <= window.closesMinutes
  );
  return fit ? { withinHours: true } : { withinHours: false, reason: 'OUTSIDE_WINDOW' };
}

function toLocalDateString(calendarUtcMs: number): string {
  const d = new Date(calendarUtcMs);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Fenêtres candidates suivantes, DÉTERMINISTES et BORNÉES (jamais un
 * rendez-vous automatique). Un candidat est le début de fenêtre le plus tôt
 * (ou l'instant courant arrondi à la minute si on est déjà DANS une fenêtre)
 * tel qu'un rendez-vous de `durationMs` tienne avant la fermeture. Le balayage
 * s'arrête après `maxDays` jours ou `maxResults` candidats. N'examine PAS les
 * rendez-vous existants : c'est un aperçu d'OUVERTURE, pas une réservation.
 */
export function findNextAvailableWindows(params: {
  after: Date;
  durationMs: number;
  timezone: string;
  windows: readonly NormalizedBusinessHour[];
  maxDays: number;
  maxResults: number;
}): string[] {
  const { after, durationMs, timezone, windows, maxDays, maxResults } = params;
  if (windows.length === 0 || maxResults <= 0 || maxDays <= 0) return [];

  const base = getZonedParts(after, timezone);
  const baseCalendarMs = Date.UTC(base.year, base.month - 1, base.day);
  const afterMs = after.getTime();
  const results: string[] = [];

  for (let offset = 0; offset < maxDays; offset++) {
    const calendarMs = baseCalendarMs + offset * 86_400_000;
    const dateStr = toLocalDateString(calendarMs);
    const dayOfWeek = new Date(calendarMs).getUTCDay();
    const dayWindows = windows
      .filter((window) => window.dayOfWeek === dayOfWeek)
      .sort((a, b) => a.opensMinutes - b.opensMinutes);

    for (const window of dayWindows) {
      const opensAt = zonedLocalToUtc(
        dateStr,
        minutesToHm(window.opensMinutes),
        timezone
      );
      const closesAt = zonedLocalToUtc(
        dateStr,
        minutesToHm(window.closesMinutes),
        timezone
      );
      if (!opensAt || !closesAt) continue;

      const candidateMs = Math.max(
        opensAt.getTime(),
        Math.ceil(afterMs / 60_000) * 60_000
      );
      if (candidateMs + durationMs > closesAt.getTime()) continue;

      results.push(new Date(candidateMs).toISOString());
      if (results.length >= maxResults) return results;
    }
  }

  return results;
}
