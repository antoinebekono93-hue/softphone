import twilio from "twilio";

if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
  throw new Error(
    "TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN must be set in environment variables"
  );
}

/**
 * Master Twilio client — used for creating subaccounts and
 * managing top-level resources.
 */
export const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/**
 * Creates a new Twilio subaccount for a tenant organization.
 * Returns the subaccount SID and Auth Token.
 */
export async function createSubaccount(friendlyName: string) {
  const account = await twilioClient.api.accounts.create({
    friendlyName,
  });

  return {
    sid: account.sid,
    authToken: account.authToken,
  };
}

/**
 * Creates a TwiML Application in the given subaccount.
 * The TwiML app specifies where Twilio sends webhook requests
 * when calls are initiated from the SDK.
 */
export async function createTwimlApp(
  subaccountSid: string,
  subaccountToken: string,
  appUrl: string
) {
  const subClient = twilio(subaccountSid, subaccountToken);

  const app = await subClient.applications.create({
    friendlyName: "Antigravity Voice",
    voiceMethod: "POST",
    voiceUrl: `${appUrl}/api/voice/twiml`,
    statusCallback: `${appUrl}/api/voice/status`,
    statusCallbackMethod: "POST",
  });

  return {
    twimlAppSid: app.sid,
  };
}

/**
 * Generates API Key + Secret for a subaccount.
 * These are used for generating Access Tokens (more secure than using Auth Token).
 */
export async function createApiKey(
  subaccountSid: string,
  subaccountToken: string
) {
  const subClient = twilio(subaccountSid, subaccountToken);

  const key = await subClient.newKeys.create({
    friendlyName: "Antigravity Voice Key",
  });

  return {
    apiKey: key.sid,
    apiSecret: key.secret,
  };
}

/**
 * Validates a Twilio request signature to ensure the webhook
 * request is genuinely from Twilio.
 */
export function validateTwilioSignature(
  signature: string,
  url: string,
  params: Record<string, string>
): boolean {
  return twilio.validateRequest(
    process.env.TWILIO_AUTH_TOKEN!,
    signature,
    url,
    params
  );
}
