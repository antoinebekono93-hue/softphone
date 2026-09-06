/**
 * Observabilité APP_TO_APP — logs serveur structurés, masquage et taxonomie.
 *
 * Module PURE (aucune dépendance serveur/DB/navigateur) : importable depuis les
 * routes Next et depuis les tests sans environnement particulier.
 *
 * Contrat de confidentialité (appliqué partout) :
 *  - on ne loggue JAMAIS : SDP complet, candidat ICE complet, URL/username
 *    credential TURN, tokens, secrets, header d'authentification, IP inutile ;
 *  - les IDs (callId/sessionId/userId/organizationId/participants) sont
 *    autorisés : ils servent de clé de corrélation de bout en bout ;
 *  - une destination saisie (target) est TOUJOURS masquée avant stockage/log
 *    (redactDestination) — on garde un préfixe diagnostique non réidentifiant ;
 *  - toute clé de log dont le nom évoque du sensible (sdp/candidate/credential/
 *    username/password/secret/token/url...) est remplacée par "[redacted]".
 */

export type ServerCallLogLevel = "debug" | "info" | "warn" | "error";

/** Clés dont la VALEUR est systématiquement masquée (insensibles à la casse). */
const SENSITIVE_KEY_MARKERS = [
  "sdp",
  "candidate",
  "credential",
  "password",
  "secret",
  "token",
  "authorization",
  "username",
  "iceservers",
  "url",
];

/** Longueur maximale d'une chaîne conservée dans un log. */
export const MAX_LOG_STRING_CHARS = 256;
/** Profondeur maximale de parcours d'un objet de log (anti-bombe). */
const MAX_LOG_DEPTH = 6;

const LOG_LEVELS: Record<ServerCallLogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Recopie une valeur quelconque en la NETTOYANT pour le log :
 *  - clé sensible → "[redacted]" (SDP, candidats, creds, tokens, URLs…) ;
 *  - chaînes longues → tronquées (MAX_LOG_STRING_CHARS) ;
 *  - Date → ISO ;
 *  - profondeur bornée (array/objet) ;
 *  - ne lève JAMAIS (robuste à tout input).
 */
export function sanitizeLogDetails(input: unknown): unknown {
  const seen = new WeakSet<object>();
  const walk = (value: unknown, depth: number): unknown => {
    if (value === null || value === undefined) return value;
    const t = typeof value;
    if (t === "number" || t === "boolean") return value;
    if (t === "string") {
      const s = value as string;
      return s.length > MAX_LOG_STRING_CHARS
        ? `${s.slice(0, MAX_LOG_STRING_CHARS - 3)}...`
        : s;
    }
    if (t === "bigint") return String(value);
    if (t === "function" || t === "symbol") return "[omitted]";
    if (value instanceof Date) return value.toISOString();
    if (depth >= MAX_LOG_DEPTH) return "[truncated]";

    if (Array.isArray(value)) {
      if (seen.has(value)) return "[cyclic]";
      seen.add(value);
      return value.map((item) => walk(item, depth + 1));
    }
    if (typeof (value as Record<string, unknown>)?.entries === "function") {
      // Map/Set → iso JSON-safe (clés sensibles aussi masquées).
      try {
        return value instanceof Map
          ? Object.fromEntries(
              Array.from(value.entries()).map(([k, v]) => {
                const keyStr = typeof k === "string" ? k : String(k);
                const kk = keyStr.toLowerCase();
                const sensitive = SENSITIVE_KEY_MARKERS.some((m) => kk.includes(m));
                return [keyStr, sensitive ? "[redacted]" : walk(v, depth + 1)];
              })
            )
          : [...(value as Set<unknown>)].map((v) => walk(v, depth + 1));
      } catch {
        return "[omitted]";
      }
    }
    if (typeof value === "object") {
      if (seen.has(value)) return "[cyclic]";
      seen.add(value);
      const out: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(
        value as Record<string, unknown>
      )) {
        const k = key.toLowerCase();
        const sensitive = SENSITIVE_KEY_MARKERS.some((m) => k.includes(m));
        out[key] = sensitive ? "[redacted]" : walk(val, depth + 1);
      }
      return out;
    }
    return String(value);
  };
  return walk(input, 0);
}

/**
 * Masque une destination avant log/stockage.
 * - garde un préfixe court (diagnostique, non réidentifiant) pour distinguer
 *   "erreur de frappe sur un username" d'une vraie usine à gaz ;
 * - null/undefined/chaîne courte → "***".
 */
export function redactDestination(
  value: string | null | undefined
): string | null {
  if (value === null || value === undefined) return null;
  const v = String(value);
  if (v.length <= 5) return "***";
  return `${v.slice(0, 3)}***`;
}

function readLogLevel(): ServerCallLogLevel {
  const raw = process.env.APP_CALL_LOG_LEVEL?.toLowerCase?.();
  return raw === "debug" || raw === "warn" || raw === "error"
    ? raw
    : "info";
}

/**
 * Émet un événement serveur structuré, format unifié :
 *   [app-call] <EVENT> <callId> {details...}
 * Les détails passent par sanitizeLogDetails à chaque appel (aucun secret ne
 * peut fuiter via une clé mal nommée). Ne lève jamais.
 *
 * Niveau filtré par env APP_CALL_LOG_LEVEL (debug|info|warn|error, défaut info) :
 * un SIGNAUX_DEBUG est donc invisible en prod par défaut, sans modifier le code.
 */
export function logServerCallEvent(args: {
  level: ServerCallLogLevel;
  event: string;
  callId?: string | null;
  details?: Record<string, unknown>;
}): void {
  try {
    const verbosity = readLogLevel();
    const enabled =
      LOG_LEVELS[args.level] >= LOG_LEVELS[verbosity];
    if (!enabled) return;
    const clean = sanitizeLogDetails(args.details ?? {});
    const scope = args.callId ? ` ${args.callId}` : "";
    const line = `[app-call] ${args.event}${scope}`;
    const fn =
      args.level === "error"
        ? console.error
        : args.level === "warn"
        ? console.warn
        : args.level === "debug"
        ? console.debug
        : console.log;
    fn(line, clean);
  } catch {
    // L'observabilité ne doit jamais casser le flux d'appel.
  }
}

// ── Taxonomie des échecs ─────────────────────────────────────────────────────
// Rassemble les sources dispersées (reasons serveur UPPER_SNAKE, faillures
// client lowercase, media kinds) en CATÉGORIES stables, pour pouvoir compter /
// filtrer les échecs d'un callId de bout en bout.

export const APP_CALL_FAILURE_CATEGORIES = [
  "AUTH", // authenticé ? session/org absente
  "ROUTING", // cible invalide / non routable APP_TO_APP
  "POLICY", // plan / fair-use (quota horaire, journalier)
  "BUSY", // conflit de concurrence (callee/org occupé, série)
  "SIGNALING", // payload invalide, state machine, rate limit, publish
  "ICE", // échec de connexion/restart ICE
  "MEDIA", // getUserMedia / lecture audio / autoplay
  "TIMEOUT", // sonnerie expirée / durée max serveur
  "TERMINATED", // fin normale (hangup, refus) — pas un bug
  "UNKNOWN",
] as const;

export type AppCallFailureCategory =
  (typeof APP_CALL_FAILURE_CATEGORIES)[number];

/** Mapping EXACT des reasons serveur connues vers leur catégorie. */
const EXACT_CATEGORY: Record<string, AppCallFailureCategory> = {
  // AUTH
  UNAUTHORIZED: "AUTH",
  NO_ORGANIZATION: "AUTH",
  // ROUTING
  EMPTY_TARGET: "ROUTING",
  INVALID_TARGET: "ROUTING",
  SELF_CALL: "ROUTING",
  TARGET_NOT_CALLABLE: "ROUTING",
  NOT_APP_TO_APP_DESTINATION: "ROUTING",
  CALLEE_NOT_FOUND: "ROUTING",
  // POLICY
  ORGANIZATION_NOT_FOUND: "POLICY",
  NO_PLAN: "POLICY",
  PLAN_INACTIVE: "POLICY",
  MAX_CALLS_PER_HOUR: "POLICY",
  MAX_CALLS_PER_DAY: "POLICY",
  // BUSY
  CALLEE_BUSY: "BUSY",
  CALLER_BUSY: "BUSY",
  ORGANIZATION_MAX_CONCURRENT: "BUSY",
  SERIALIZATION_CONFLICT: "BUSY",
  // SIGNALING
  INVALID_PAYLOAD_TYPE: "SIGNALING",
  UNKNOWN_SIGNAL_TYPE: "SIGNALING",
  SDP_REQUIRED: "SIGNALING",
  SDP_TOO_LARGE: "SIGNALING",
  CANDIDATE_REQUIRED: "SIGNALING",
  CANDIDATE_FIELD_REQUIRED: "SIGNALING",
  CANDIDATE_TOO_LARGE: "SIGNALING",
  REASON_TYPE: "SIGNALING",
  REASON_TOO_LARGE: "SIGNALING",
  PAYLOAD_TOO_LARGE: "SIGNALING",
  PAYLOAD_UNSERIALIZABLE: "SIGNALING",
  SIGNAL_RATE_LIMIT: "SIGNALING",
  SIGNAL_PUBLISH_FAILED: "SIGNALING",
  INVALID_TRANSITION: "SIGNALING",
  FORBIDDEN_ROLE: "SIGNALING",
  // TIMEOUT
  RING_TIMEOUT: "TIMEOUT",
  MAX_DURATION: "TIMEOUT",
};

/**
 * Classe une raison d'échec (serveur UPPER_SNAKE, statut FAILED, media kind,
 * message libre…) en catégorie stable. PURE.
 *  - d'abord le mapping EXACT (si code connu, pas d'ambiguïté) ;
 *  - puis les media kinds navigateur ;
 *  - puis des règles par mots-clés (robustes aux variations casse/espaces) ;
 *  - défaut UNKNOWN.
 */
export function classifyAppCallFailure(
  reason: string | null | undefined
): { category: AppCallFailureCategory; code: string } {
  const raw = (reason ?? "").trim();
  if (!raw) return { category: "UNKNOWN", code: "" };

  const exact = EXACT_CATEGORY[raw];
  if (exact) return { category: exact, code: raw };

  const lower = raw.toLowerCase();
  const media = [
    "permission-denied",
    "not-found",
    "not-readable",
    "in-use",
    "abort",
    "overconstrained",
    "autoplay",
    "notallowed",
    "notreadable",
    "notallowederror",
  ];
  if (media.includes(lower)) return { category: "MEDIA", code: raw };

  if (/\bice\b|restart|reconnect|relay-only|noice|ice-failed|failed-ice/.test(lower))
    return { category: "ICE", code: raw };
  if (
    /microphone|micr?|media|audio|track|device|getusermedia|speaker|autoplay|playback/.test(lower)
  )
    return { category: "MEDIA", code: raw };
  if (/timeout|overdue|expired|ringing-out|unanswered/.test(lower))
    return { category: "TIMEOUT", code: raw };
  if (
    /hangup|hang-up|missed|declined|decline|cancel|ended|end-call|user-/.test(lower)
  )
    return { category: "TERMINATED", code: raw };
  return { category: "UNKNOWN", code: raw };
}