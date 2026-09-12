import {
  normalizeVoicemailSettings,
  voicemailPlanDenialPayload,
  VOICEMAIL_DELAY_MAX_SECONDS,
  VOICEMAIL_DELAY_MIN_SECONDS,
} from "../lib/pstn-voicemail-policy";

let failures = 0;
function check(label: string, condition: boolean) {
  console.log(`${condition ? "PASS" : "FAIL"} ${label}`);
  if (!condition) failures += 1;
}

const valid = normalizeVoicemailSettings({
  voicemailEnabled: true,
  voicemailDelaySeconds: 30,
  voicemailGreeting: "  Laissez un message.  ",
});
check("normalise la configuration", valid.voicemailEnabled && valid.voicemailDelaySeconds === 30 && valid.voicemailGreeting === "Laissez un message.");
check("autorise un forfait avec enregistrement", voicemailPlanDenialPayload({ name: "Pro", hasRecording: true }) === null);
check("refuse un forfait sans enregistrement", voicemailPlanDenialPayload({ name: "Basic", hasRecording: false })?.code === "VOICEMAIL_NOT_INCLUDED");

for (const delay of [VOICEMAIL_DELAY_MIN_SECONDS - 1, VOICEMAIL_DELAY_MAX_SECONDS + 1, 10.5]) {
  let rejected = false;
  try { normalizeVoicemailSettings({ voicemailEnabled: true, voicemailDelaySeconds: delay }); } catch { rejected = true; }
  check(`refuse le délai invalide ${delay}`, rejected);
}

let longGreetingRejected = false;
try { normalizeVoicemailSettings({ voicemailEnabled: true, voicemailGreeting: "x".repeat(1001) }); } catch { longGreetingRejected = true; }
check("refuse un message supérieur à 1000 caractères", longGreetingRejected);

if (failures) process.exit(1);
