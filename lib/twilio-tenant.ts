import twilio from "twilio";
import { AccessToken } from "twilio";
import { prisma } from "./prisma";

const { VoiceGrant } = AccessToken;

/**
 * Gets the Twilio credentials for a specific tenant organization.
 * Returns a scoped Twilio client using the subaccount credentials.
 */
export async function getTenantTwilioClient(organizationId: string) {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      twilioSubaccountSid: true,
      twilioSubaccountToken: true,
      twilioApiKey: true,
      twilioApiSecret: true,
      twilioTwimlAppSid: true,
      plan: true,
      planStatus: true,
    },
  });

  if (!org) {
    throw new Error(`Organization not found: ${organizationId}`);
  }

  if (!org.twilioSubaccountSid || !org.twilioSubaccountToken) {
    throw new Error(
      `Twilio not configured for organization: ${organizationId}`
    );
  }

  if (org.planStatus !== "ACTIVE" && org.planStatus !== "TRIALING") {
    throw new Error(`Organization plan is not active: ${org.planStatus}`);
  }

  const client = twilio(org.twilioSubaccountSid, org.twilioSubaccountToken);

  return {
    client,
    subaccountSid: org.twilioSubaccountSid,
    subaccountToken: org.twilioSubaccountToken,
    apiKey: org.twilioApiKey,
    apiSecret: org.twilioApiSecret,
    twimlAppSid: org.twilioTwimlAppSid,
    plan: org.plan,
  };
}

/**
 * Generates an Access Token for the Twilio Voice SDK.
 * The token is scoped to the tenant's subaccount.
 */
export async function generateVoiceToken(
  organizationId: string,
  userId: string,
  identity: string
) {
  const tenant = await getTenantTwilioClient(organizationId);

  if (!tenant.apiKey || !tenant.apiSecret || !tenant.twimlAppSid) {
    throw new Error(
      "Twilio API Key, Secret, or TwiML App not configured for this organization"
    );
  }

  const token = new AccessToken(
    tenant.subaccountSid,
    tenant.apiKey,
    tenant.apiSecret,
    {
      identity,
      ttl: 3600, // 1 hour
    }
  );

  const voiceGrant = new VoiceGrant({
    outgoingApplicationSid: tenant.twimlAppSid,
    incomingAllow: true,
  });

  token.addGrant(voiceGrant);

  return token.toJwt();
}

/**
 * Finds the organization associated with a Twilio subaccount SID.
 * Used by webhooks to identify the tenant.
 */
export async function getOrganizationBySubaccountSid(
  subaccountSid: string
) {
  return prisma.organization.findUnique({
    where: { twilioSubaccountSid: subaccountSid },
    include: {
      users: {
        select: { id: true, name: true, email: true },
      },
      phoneNumbers: {
        where: { status: "ACTIVE" },
        select: { id: true, number: true, assignedUserId: true },
      },
    },
  });
}
