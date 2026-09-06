/**
 * Tests de la logique PURE d'observabilité APP_TO_APP (lib/app-call-observability.ts).
 * Exécution : npx tsx scripts/test-app-call-observability.ts
 *
 * Couvre :
 *  - classifyAppCallFailure : raisons serveur UPPER_SNAKE, media kinds,
 *    messages libres, mapping vers des catégories stables ;
 *  - redactDestination : jamais de destination en clair dans les logs ;
 *  - sanitizeLogDetails : masquage des clés sensibles (sdp/candidate/credential/
 *    token/username...), troncature, robustesse (cycles, dates, objets imbriqués).
 */

import {
  classifyAppCallFailure,
  redactDestination,
  sanitizeLogDetails,
  APP_CALL_FAILURE_CATEGORIES,
  MAX_LOG_STRING_CHARS,
} from "../lib/app-call-observability";

let failures = 0;
const check = (name: string, cond: boolean) => {
  if (cond) {
    console.log(`PASS  ${name}`);
  } else {
    failures++;
    console.log(`FAIL  ${name}`);
  }
};

// ── classifyAppCallFailure : mapping EXACT raisons serveur ─────────────────
check(
  "EXACT: UNAUTHORIZED → AUTH",
  classifyAppCallFailure("UNAUTHORIZED").category === "AUTH"
);
check(
  "EXACT: EMPTY_TARGET → ROUTING",
  classifyAppCallFailure("EMPTY_TARGET").category === "ROUTING"
);
check(
  "EXACT: INVALID_TARGET → ROUTING",
  classifyAppCallFailure("INVALID_TARGET").category === "ROUTING"
);
check(
  "EXACT: CALLEE_BUSY → BUSY",
  classifyAppCallFailure("CALLEE_BUSY").category === "BUSY"
);
check(
  "EXACT: SERIALIZATION_CONFLICT → BUSY",
  classifyAppCallFailure("SERIALIZATION_CONFLICT").category === "BUSY"
);
check(
  "EXACT: SDP_TOO_LARGE → SIGNALING",
  classifyAppCallFailure("SDP_TOO_LARGE").category === "SIGNALING"
);
check(
  "EXACT: INVALID_TRANSITION → SIGNALING",
  classifyAppCallFailure("INVALID_TRANSITION").category === "SIGNALING"
);
check(
  "EXACT: SIGNAL_RATE_LIMIT → SIGNALING",
  classifyAppCallFailure("SIGNAL_RATE_LIMIT").category === "SIGNALING"
);
check(
  "EXACT: MAX_CALLS_PER_HOUR → POLICY",
  classifyAppCallFailure("MAX_CALLS_PER_HOUR").category === "POLICY"
);

// ── classifyAppCallFailure : media kinds navigateur ────────────────────────
check(
  "MEDIA: permission-denied",
  classifyAppCallFailure("permission-denied").category === "MEDIA"
);
check(
  "MEDIA: not-found",
  classifyAppCallFailure("not-found").category === "MEDIA"
);
check(
  "MEDIA: NotAllowedError",
  classifyAppCallFailure("NotAllowedError").category === "MEDIA"
);

// ── classifyAppCallFailure : messages libres (serveur reason FAILED) ────────
check(
  "ICE: 'ice connection failed'",
  classifyAppCallFailure("ice connection failed").category === "ICE"
);
check(
  "ICE: 'ICE restart failed'",
  classifyAppCallFailure("ICE restart failed").category === "ICE"
);
check(
  "TIMEOUT: 'ringing timeout'",
  classifyAppCallFailure("ringing timeout").category === "TIMEOUT"
);
check(
  "MEDIA: 'microphone permission denied'",
  classifyAppCallFailure("microphone permission denied").category === "MEDIA"
);
check(
  "TERMINATED: 'hangup'",
  classifyAppCallFailure("hangup").category === "TERMINATED"
);
check(
  "TERMINATED: 'User declined call'",
  classifyAppCallFailure("User declined call").category === "TERMINATED"
);
check(
  "UNKNOWN: inconnu",
  classifyAppCallFailure("une-erreur-bizarre").category === "UNKNOWN"
);
check(
  "code conservé même sur UNKNOWN",
  classifyAppCallFailure("x!y").code === "x!y"
);

// ── redactDestination ──────────────────────────────────────────────────────
check(
  "redact null → null",
  redactDestination(null) === null
);
check(
  "redact undefined → null",
  redactDestination(undefined) === null
);
check(
  "redact court → '***'",
  redactDestination("abc") === "***"
);
check(
  "redact long → préfixe + *** (jamais en clair)",
  (() => {
    const r = redactDestination("janedoe@corp.com");
    return r !== null && r.length < "janedoe@corp.com".length && !r.includes("janedoe@corp.com");
  })()
);
check(
  "redact préserve au plus 3 premiers chars",
  (() => {
    const r = redactDestination("0123456789");
    return r !== null && r === "012***";
  })()
);

// ── sanitizeLogDetails : masquage des clés sensibles ───────────────────────
const san = (o: unknown): Record<string, unknown> => sanitizeLogDetails(o) as Record<string, unknown>;
check(
  "sdp masqué",
  san({ sdp: "v=0 big-sdp" }).sdp === "[redacted]"
);
check(
  "candidate (objet complet) masqué → '[redacted]'",
  san({ candidate: { candidate: "candidate:1 ...", sdpMid: "0" } }).candidate === "[redacted]"
);
check(
  "credential masqué",
  san({ credential: "t0k3n" }).credential === "[redacted]"
);
check(
  "username masqué",
  san({ username: "admin" }).username === "[redacted]"
);
check(
  "token masqué",
  san({ token: "jwt" }).token === "[redacted]"
);
check(
  "url masquée",
  san({ url: "turn:turn.example.com" }).url === "[redacted]"
);
check(
  "insensible à la casse (Sdp / Candidate)",
  san({ Sdp: "x", Candidate: "y" }).Sdp === "[redacted]" &&
    san({ Sdp: "x" }).Sdp === "[redacted]"
);
check(
  "champ non sensible conservé",
  san({ callId: "abc", reason: "RING_TIMEOUT" }).reason === "RING_TIMEOUT"
);

// ── sanitizeLogDetails : troncature longues chaînes ─────────────────────────
check(
  "chaîne > MAX tronquée",
  (() => {
    const long = "a".repeat(MAX_LOG_STRING_CHARS + 100);
    const out = san({ msg: long }).msg as string;
    return out.length <= MAX_LOG_STRING_CHARS && out.endsWith("...");
  })()
);

// ── sanitizeLogDetails : robustesse (dates, cycles, imbrication) ───────────
check(
  "Date → ISO",
  san({ d: new Date("2024-01-01T00:00:00Z") }).d === "2024-01-01T00:00:00.000Z"
);
check(
  "cycle → '[cyclic]' sans crash",
  (() => {
    const a: Record<string, unknown> = { name: "x" };
    a.self = a;
    const out = san({ a }) as { a: Record<string, unknown> };
    return out.a.self === "[cyclic]";
  })()
);
check(
  "null/undefined conservés",
  (san({ a: null }) as { a: null }).a === null &&
    (san({ b: undefined }) as { b: undefined }).b === undefined
);
check(
  "primitives intactes",
  (san({ n: 42, b: true, s: "ok" }) as { n: number; b: boolean; s: string }).n === 42 &&
    (san({ n: 42, b: true, s: "ok" }) as { n: number; b: boolean; s: string }).s === "ok"
);
check(
  "Array de valeurs traité (map)",
  (() => {
    const out = sanitizeLogDetails([1, "two", { sdp: "x" }]) as unknown[];
    return out[0] === 1 && (out[2] as Record<string, unknown>).sdp === "[redacted]";
  })()
);
check(
  "Map → objet JSON-safe",
  (() => {
    const m = new Map<string, unknown>([["sdp", "x"], ["ok", 1]]);
    const out = sanitizeLogDetails(m) as Record<string, unknown>;
    return out.sdp === "[redacted]" && out.ok === 1;
  })()
);

// ── catégories exposées cohérentes ─────────────────────────────────────────
check(
  "APP_CALL_FAILURE_CATEGORIES non vide et définit",
  Array.isArray(APP_CALL_FAILURE_CATEGORIES) && APP_CALL_FAILURE_CATEGORIES.length > 0
);
check(
  "toute catégorie de classification est dans le jeu déclaré",
  (() => {
    for (const c of [
      "AUTH", "ROUTING", "POLICY", "BUSY", "SIGNALING",
      "ICE", "MEDIA", "TIMEOUT", "TERMINATED", "UNKNOWN",
    ]) {
      if (!(APP_CALL_FAILURE_CATEGORIES as readonly string[]).includes(c)) return false;
    }
    return true;
  })()
);

console.log("");
console.log(
  failures === 0
    ? "TOUS LES TESTS PASSENT"
    : `${failures} TEST(S) EN ÉCHEC`
);
process.exit(failures === 0 ? 0 : 1);