/**
 * Conversion d'une heure locale "mur" vers un instant UTC, sans dépendance de
 * date externe (aucune lib date n'est présente dans le projet).
 *
 * Les horaires DST ambigus (heure présente deux fois) ou inexistants (heure
 * sautée) sont REJETÉS : l'appelant doit fournir une heure non ambiguë. Aucune
 * supposition silencieuse n'est faite sur le fuseau.
 */

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isValidIanaTimeZone(timeZone: string): boolean {
  if (typeof timeZone !== 'string' || !timeZone || timeZone.length > 64) {
    return false;
  }
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
}

/** Offset (ms) du fuseau par rapport à UTC à l'instant `utcMs`. */
function timeZoneOffsetMs(utcMs: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(utcMs));
  const get = (type: string): number => {
    const part = parts.find((p) => p.type === type);
    return part ? Number(part.value) : 0;
  };
  const asUtc = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour'),
    get('minute'),
    get('second')
  );
  return asUtc - utcMs;
}

/**
 * Convertit `date` (YYYY-MM-DD) + `time` (HH:MM) interprétés dans `timeZone`
 * vers un Date UTC. Renvoie null si le format est invalide, la date inexistante
 * ou l'heure locale ambiguë/inexistante (transition DST).
 */
export function zonedLocalToUtc(
  date: string,
  time: string,
  timeZone: string
): Date | null {
  const dateMatch = DATE_RE.exec(date);
  const timeMatch = TIME_RE.exec(time);
  if (!dateMatch || !timeMatch) return null;

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);

  const naiveUtc = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
  const calendarCheck = new Date(naiveUtc);
  if (
    calendarCheck.getUTCFullYear() !== year ||
    calendarCheck.getUTCMonth() !== month - 1 ||
    calendarCheck.getUTCDate() !== day
  ) {
    return null;
  }

  const offsetA = timeZoneOffsetMs(naiveUtc, timeZone);
  const candidate = naiveUtc - offsetA;
  const offsetB = timeZoneOffsetMs(candidate, timeZone);
  if (offsetA !== offsetB) return null;

  return new Date(candidate);
}
