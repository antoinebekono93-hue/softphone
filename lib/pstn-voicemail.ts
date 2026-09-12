import { prisma } from "@/lib/prisma";
import { getConfiguredTelnyxClient } from "@/lib/telnyx";
import {
  DEFAULT_VOICEMAIL_GREETING,
  VOICEMAIL_MAX_RECORDING_SECONDS,
} from "@/lib/pstn-voicemail-policy";

const ACTIVE_CALL_STATUSES = ["INITIATED", "RINGING"];

export async function executePstnVoicemail(callLogId: string) {
  const claimed = await prisma.callLog.updateMany({
    where: {
      id: callLogId,
      voicemailStatus: "SCHEDULED",
      status: { in: ACTIVE_CALL_STATUSES },
      voicemailDueAt: { lte: new Date() },
    },
    data: { voicemailStatus: "STARTING", voicemailStartedAt: new Date() },
  });
  if (claimed.count !== 1) return { started: false, reason: "NOT_CLAIMED" };

  const call = await prisma.callLog.findUnique({
    where: { id: callLogId },
    include: {
      phoneNumber: {
        include: { organization: { include: { pricingPlan: true } } },
      },
    },
  });
  const number = call?.phoneNumber;
  if (!call || !number || !number.voicemailEnabled || number.incomingRoutingMode !== "APP" || !number.organization.pricingPlan?.hasRecording) {
    await prisma.callLog.updateMany({
      where: { id: callLogId, voicemailStatus: "STARTING" },
      data: { voicemailStatus: "CANCELLED" },
    });
    return { started: false, reason: "VOICEMAIL_CONFIGURATION_CHANGED" };
  }

  try {
    const telnyx = await getConfiguredTelnyxClient();
    await telnyx.calls.actions.answer(call.telnyxCallControlId, {
      command_id: `${call.voicemailCommandId}-answer`,
    });
    return { started: true };
  } catch (error) {
    console.error(`[PSTN Voicemail] answer failed for ${call.telnyxCallControlId}`, error);
    await prisma.callLog.updateMany({
      where: { id: call.id, voicemailStatus: "STARTING" },
      data: { voicemailStatus: "FAILED" },
    });
    return { started: false, reason: "TELNYX_ANSWER_FAILED" };
  }
}

export async function startPstnVoicemailGreeting(callControlId: string) {
  const call = await prisma.callLog.findUnique({
    where: { telnyxCallControlId: callControlId },
    include: { phoneNumber: true },
  });
  if (!call || call.voicemailStatus !== "STARTING" || !call.phoneNumber) return false;

  const moved = await prisma.callLog.updateMany({
    where: { id: call.id, voicemailStatus: "STARTING" },
    data: { voicemailStatus: "GREETING", status: "IN_PROGRESS", answeredAt: new Date() },
  });
  if (moved.count !== 1) return false;

  try {
    const telnyx = await getConfiguredTelnyxClient();
    await telnyx.calls.actions.speak(callControlId, {
      payload: call.phoneNumber.voicemailGreeting || DEFAULT_VOICEMAIL_GREETING,
      voice: "AWS.Polly.Lea-Neural",
      language: "fr-FR",
      command_id: `${call.voicemailCommandId}-greeting`,
    });
    return true;
  } catch (error) {
    console.error(`[PSTN Voicemail] greeting failed for ${callControlId}`, error);
    await prisma.callLog.update({ where: { id: call.id }, data: { voicemailStatus: "FAILED" } });
    throw error;
  }
}

export async function startPstnVoicemailRecording(callControlId: string) {
  const call = await prisma.callLog.findUnique({ where: { telnyxCallControlId: callControlId } });
  if (!call || call.voicemailStatus !== "GREETING") return false;

  const moved = await prisma.callLog.updateMany({
    where: { id: call.id, voicemailStatus: "GREETING" },
    data: { voicemailStatus: "RECORDING" },
  });
  if (moved.count !== 1) return false;

  try {
    const telnyx = await getConfiguredTelnyxClient();
    await telnyx.calls.actions.startRecording(callControlId, {
      channels: "single",
      format: "mp3",
      recording_track: "inbound",
      play_beep: true,
      trim: "trim-silence",
      max_length: VOICEMAIL_MAX_RECORDING_SECONDS,
      command_id: `${call.voicemailCommandId}-record`,
      custom_file_name: `voicemail-${call.id.slice(0, 20)}`,
    });
    return true;
  } catch (error) {
    console.error(`[PSTN Voicemail] recording failed for ${callControlId}`, error);
    await prisma.callLog.update({ where: { id: call.id }, data: { voicemailStatus: "FAILED" } });
    throw error;
  }
}

export async function processDuePstnVoicemails(limit = 25) {
  await prisma.callLog.updateMany({
    where: {
      voicemailStatus: "STARTING",
      status: { in: ACTIVE_CALL_STATUSES },
      voicemailStartedAt: { lte: new Date(Date.now() - 2 * 60 * 1000) },
    },
    data: { voicemailStatus: "SCHEDULED", voicemailDueAt: new Date() },
  });
  const due = await prisma.callLog.findMany({
    where: {
      voicemailStatus: "SCHEDULED",
      voicemailDueAt: { lte: new Date() },
      status: { in: ACTIVE_CALL_STATUSES },
    },
    select: { id: true },
    orderBy: { voicemailDueAt: "asc" },
    take: Math.max(1, Math.min(limit, 100)),
  });
  const results = [];
  for (const call of due) results.push(await executePstnVoicemail(call.id));
  return { scanned: due.length, started: results.filter((item) => item.started).length };
}
