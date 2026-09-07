/**
 * Validation / classification des variables d'environnement.
 *
 * 3 paliers :
 *
 *  1. CORE          — la plateforme ne peut pas démarrer sans elles.
 *                     Fail-fast partout (début + placeholder en prod).
 *                     DATABASE_URL, AUTH_SECRET, ENCRYPTION_KEY, CRON_SECRET.
 *
 *  2. TELNYX        — cœur téléphonique du produit : sans Telnyx, aucun appel/SMS.
 *                     Fail-fast en production, avertissement en dev.
 *                     TELNYX_API_KEY, TELNYX_PUBLIC_KEY, TELNYX_SIP_CONNECTION_ID.
 *
 *  3. OPTIONNEL     — intégrations débranchables : la dégradation est fail-closed
 *                     au niveau des routes (Stripe 503 sans clé, IA absente, etc.).
 *                     On journalise un WARNING clair, jamais un crash au boot.
 *                     OpenAI, Stripe, Pusher/Realtime, Upstash Redis, mémoire agent.
 *
 * Règle NEXT_PUBLIC_* : inlinées au BUILD côté client ; leur absence au
 * runtime serveur n'est pas un problème. Seul un placeholder est signalé.
 */

type Tier = { label: string; vars: string[] };

const CORE: Tier = {
  label: "CORE",
  vars: ["DATABASE_URL", "AUTH_SECRET", "ENCRYPTION_KEY", "CRON_SECRET"],
};

const TELNYX: Tier = {
  label: "TELNYX",
  vars: ["TELNYX_API_KEY", "TELNYX_PUBLIC_KEY", "TELNYX_SIP_CONNECTION_ID"],
};

const OPTIONAL_FEATURES: Tier[] = [
  { label: "Mémoire des agents (Upstash Redis)", vars: ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"] },
  { label: "Mémoire des agents (variables REDIS_AGENT_MEMORY_*)", vars: ["REDIS_AGENT_MEMORY_URL", "REDIS_AGENT_MEMORY_KEY", "REDIS_AGENT_MEMORY_STORE_ID"] },
  { label: "IA conversationnelle (OpenAI)", vars: ["OPENAI_API_KEY"] },
  { label: "Paiements en ligne (Stripe)", vars: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"] },
  { label: "Realtime / notifications (Pusher)", vars: ["PUSHER_APP_ID", "PUSHER_SECRET", "NEXT_PUBLIC_PUSHER_KEY", "NEXT_PUBLIC_PUSHER_CLUSTER"] },
  { label: "Auth.js legacy (NEXTAUTH_*)", vars: ["NEXTAUTH_SECRET", "NEXTAUTH_URL"] },
];

let hasValidated = false;

/** Détecte les valeurs de placeholder (E2E / template). Tolérées en dev uniquement. */
function isPlaceholder(value: string): boolean {
  return /placeholder|e2e-not-used|your[_-]|example[_-]|replace-me|changeme|xxxx/i.test(value);
}

function isPublicBuildVar(name: string): boolean {
  return name.startsWith("NEXT_PUBLIC_");
}

export function validateEnv(): void {
  if (hasValidated) return;
  hasValidated = true;

  // Skip pendant le build Next.js (les NEXT_PUBLIC_* sont inlinées au build,
  // et les clés runtime ne sont pas toutes disponibles ici).
  if (
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.NEXT_PHASE === "phase-development-server"
  ) {
    return;
  }

  const isProd = process.env.NODE_ENV === "production";

  /** normalise : placeholder toléré hors prod ; NEXT_PUBLIC_ toléré si absent au runtime. */
  const isOk = (name: string, value: string | undefined): boolean => {
    if (isPublicBuildVar(name)) {
      return value === undefined || !isProd || !isPlaceholder(value);
    }
    if (!value) return false;
    return !(isProd && isPlaceholder(value));
  };

  const bad = (tier: Tier) =>
    tier.vars.filter((v) => !isOk(v, process.env[v]));

  // ── Palier 1 : CORE — jamais de boot sans elles ─────────────────────────
  const coreProblems = bad(CORE);
  if (coreProblems.length > 0) {
    const msg = `[ENV CORE] Variables critiques manquantes/invalides : ${coreProblems.join(", ")}`;
    console.error("CRITICAL:", msg);
    throw new Error(msg);
  }

  // ── Palier 2 : TELNYX — cœur téléphonique ───────────────────────────────
  const telnyxProblems = bad(TELNYX);
  if (telnyxProblems.length > 0) {
    const msg = `[ENV TELNYX] Intégration téléphonie cible : ${telnyxProblems.join(", ")}`;
    if (isProd) {
      console.error("CRITICAL:", msg, "— le produit est inutilisable sans Telnyx.");
      throw new Error(msg);
    }
    console.warn("WARNING:", msg, "— démarrage toléré en dev.");
  }

  // ── Palier 3 : OPTIONNEL — dégradation fail-closed gérée par les routes ─
  for (const feature of OPTIONAL_FEATURES) {
    const missing = bad(feature);
    if (missing.length > 0) {
      console.warn(
        `[ENV OPTIONNEL] "${feature.label}" non configuré (${missing.join(", ")}). ` +
        "La fonctionnalité sera indisponible ou en dégradation contrôlée (fail-closed)."
      );
    }
  }

  // ── Contrôle spécifique ENCRYPTION_KEY (32 octets base64) ───────────────
  const encryptionKey = process.env.ENCRYPTION_KEY;
  if (encryptionKey && !isPlaceholder(encryptionKey)) {
    try {
      const decoded = Buffer.from(encryptionKey, "base64");
      if (decoded.length !== 32) {
        throw new Error("ENCRYPTION_KEY doit faire 32 octets (base64)");
      }
    } catch {
      const msg = "[ENV CORE] ENCRYPTION_KEY n'est pas un base64 valide de 32 octets";
      console.error("CRITICAL:", msg);
      throw new Error(msg);
    }
  }
}