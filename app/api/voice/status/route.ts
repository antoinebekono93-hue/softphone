import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/voice/status
 *
 * Twilio sends status callbacks here to report on call lifecycle events.
 * We use this to update CallLog records with duration and final status.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const callSid = formData.get("CallSid") as string;
    const callStatus = formData.get("CallStatus") as string;
    const callDuration = formData.get("CallDuration") as string;
    const accountSid = formData.get("AccountSid") as string;
    const from = formData.get("From") as string;
    const to = formData.get("To") as string;

    if (!callSid) {
      return NextResponse.json(
        { error: "Missing CallSid" },
        { status: 400 }
      );
    }

    // Map Twilio status to our enum
    const statusMap: Record<string, string> = {
      initiated: "INITIATED",
      ringing: "RINGING",
      "in-progress": "IN_PROGRESS",
      completed: "COMPLETED",
      busy: "BUSY",
      "no-answer": "NO_ANSWER",
      canceled: "CANCELED",
      failed: "FAILED",
    };

    const mappedStatus = statusMap[callStatus] || "INITIATED";
    const duration = callDuration ? parseInt(callDuration, 10) : 0;

    // Try to update an existing call log
    const existingLog = await prisma.callLog.findUnique({
      where: { callSid },
    });

    if (existingLog) {
      // Update existing record
      const updateData: Record<string, unknown> = {
        status: mappedStatus,
        duration,
      };

      if (mappedStatus === "IN_PROGRESS" && !existingLog.answeredAt) {
        updateData.answeredAt = new Date();
      }

      if (
        ["COMPLETED", "BUSY", "NO_ANSWER", "CANCELED", "FAILED"].includes(
          mappedStatus
        )
      ) {
        updateData.endedAt = new Date();
      }

      await prisma.callLog.update({
        where: { callSid },
        data: updateData,
      });

      // Update organization minutes usage for completed calls
      if (mappedStatus === "COMPLETED" && duration > 0 && existingLog.organizationId) {
        await prisma.organization.update({
          where: { id: existingLog.organizationId },
          data: {
            minutesUsedThisMonth: {
              increment: Math.ceil(duration / 60),
            },
          },
        });
      }
    } else {
      // Create a new record (for outbound calls initiated from SDK)
      const org = await prisma.organization.findUnique({
        where: { twilioSubaccountSid: accountSid },
      });

      if (org) {
        await prisma.callLog.create({
          data: {
            callSid,
            direction: "OUTBOUND",
            fromNumber: from || "",
            toNumber: to || "",
            status: mappedStatus,
            duration,
            organizationId: org.id,
            answeredAt:
              mappedStatus === "IN_PROGRESS" ? new Date() : undefined,
            endedAt: ["COMPLETED", "BUSY", "NO_ANSWER", "CANCELED", "FAILED"].includes(mappedStatus)
              ? new Date()
              : undefined,
          },
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Status Callback] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
