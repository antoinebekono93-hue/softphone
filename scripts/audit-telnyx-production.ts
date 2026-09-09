import { prisma } from "../lib/prisma";
import { getConfiguredTelnyxClient } from "../lib/telnyx";
import { ensureTelnyxNumberCodeControlled } from "../lib/telnyx-number-purchase";

async function main() {
  const settings = await prisma.systemSettings.findUnique({
    where: { id: "default" },
    select: { telnyxConnectionId: true },
  });
  const connectionId = settings?.telnyxConnectionId?.trim() || process.env.TELNYX_SIP_CONNECTION_ID?.trim();
  if (!connectionId) throw new Error("TELNYX_CONNECTION_NOT_CONFIGURED");

  const telnyx = await getConfiguredTelnyxClient();
  const repair = process.argv.includes("--repair");
  let resourceType = "UNKNOWN";
  let active: boolean | null = null;
  let webhookUrl: string | null = null;
  try {
    const response = await telnyx.credentialConnections.retrieve(connectionId);
    resourceType = "CREDENTIAL_CONNECTION";
    active = response.data?.active ?? null;
    webhookUrl = response.data?.webhook_event_url ?? null;
  } catch {
    try {
      const response = await telnyx.callControlApplications.retrieve(connectionId);
      resourceType = "CALL_CONTROL_APPLICATION";
      active = response.data?.active ?? null;
      webhookUrl = response.data?.webhook_event_url ?? null;
    } catch {
      resourceType = "NOT_FOUND";
    }
  }

  const numbers = await prisma.phoneNumber.findMany({
    where: { status: "ACTIVE", telnyxId: { not: { startsWith: "mock-" } } },
    select: { id: true, number: true, telnyxId: true, incomingRoutingMode: true },
  });
  const providerNumbers = [];
  for (const number of numbers) {
    try {
      if (repair) {
        await ensureTelnyxNumberCodeControlled({
          telnyx,
          telnyxNumberId: number.telnyxId,
          connectionId,
          messagingProfileId: process.env.TELNYX_MESSAGING_PROFILE_ID?.trim(),
        });
      }
      const [details, voice] = await Promise.all([
        telnyx.phoneNumbers.retrieve(number.telnyxId),
        telnyx.phoneNumbers.voice.retrieve(number.telnyxId),
      ]);
      providerNumbers.push({
        localId: number.id,
        number: number.number,
        mode: number.incomingRoutingMode,
        providerStatus: details.data?.status ?? null,
        connectionMatches: details.data?.connection_id === connectionId,
        nativeForwardingEnabled: voice.data?.call_forwarding?.call_forwarding_enabled ?? false,
      });
    } catch (error) {
      providerNumbers.push({ localId: number.id, number: number.number, error: (error as Error).message });
    }
  }

  console.log(JSON.stringify({
    operation: repair ? "REPAIRED_WITH_TELNYX_SDK" : "READ_ONLY_AUDIT",
    configuredResource: { type: resourceType, active, webhookConfigured: Boolean(webhookUrl), webhookUrl },
    managedActiveNumbers: providerNumbers,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
