export const DEFAULT_VOICEMAIL_GREETING =
  "Bonjour, nous ne pouvons pas répondre pour le moment. Laissez votre message après le bip, puis raccrochez.";

export const VOICEMAIL_DELAY_MIN_SECONDS = 10;
export const VOICEMAIL_DELAY_MAX_SECONDS = 60;
export const VOICEMAIL_MAX_RECORDING_SECONDS = 120;

export function normalizeVoicemailSettings(input: unknown) {
  const body = input && typeof input === "object" ? input as Record<string, unknown> : {};
  const enabled = body.voicemailEnabled === true;
  const delay = Number(body.voicemailDelaySeconds ?? 25);
  const greeting = typeof body.voicemailGreeting === "string" ? body.voicemailGreeting.trim() : "";

  if (!Number.isInteger(delay) || delay < VOICEMAIL_DELAY_MIN_SECONDS || delay > VOICEMAIL_DELAY_MAX_SECONDS) {
    throw new Error("VOICEMAIL_DELAY_OUT_OF_RANGE");
  }
  if (greeting.length > 1000) throw new Error("VOICEMAIL_GREETING_TOO_LONG");

  return {
    voicemailEnabled: enabled,
    voicemailDelaySeconds: delay,
    voicemailGreeting: greeting || null,
  };
}

export function voicemailPlanDenialPayload(plan: { name?: string | null; hasRecording?: boolean } | null | undefined) {
  if (plan?.hasRecording) return null;
  return {
    code: "VOICEMAIL_NOT_INCLUDED",
    error: "Le répondeur exige un forfait incluant l’enregistrement des appels.",
    currentPlan: plan ? { name: plan.name ?? null, hasRecording: Boolean(plan.hasRecording) } : null,
    missingCapabilities: ["hasRecording"],
  };
}
