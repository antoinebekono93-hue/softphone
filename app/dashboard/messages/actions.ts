"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { telnyx } from "@/lib/telnyx";
import { revalidatePath } from "next/cache";

export async function getConversations() {
  const session = await auth();
  if (!session?.user?.organizationId) return [];

  // Group SMS messages by the counterparty number.
  // Since SQLite doesn't support complex aggregations easily in Prisma, 
  // we'll fetch messages ordered by date and group them in memory.
  const messages = await prisma.smsMessage.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { sentAt: 'desc' },
  });

  const contacts = await prisma.contact.findMany({
    where: { organizationId: session.user.organizationId }
  });

  const conversationsMap = new Map<string, any>();

  for (const msg of messages) {
    // The external number is 'fromNumber' if inbound, 'toNumber' if outbound
    const contactNumber = msg.direction === 'INBOUND' ? msg.fromNumber : msg.toNumber;
    
    if (!conversationsMap.has(contactNumber)) {
      const contact = contacts.find(c => c.phone === contactNumber);
      conversationsMap.set(contactNumber, {
        contactNumber,
        latestMessage: msg,
        contact,
        unreadCount: 0 // Optional feature for later
      });
    }
  }

  return Array.from(conversationsMap.values());
}

export async function getMessages(contactNumber: string) {
  const session = await auth();
  if (!session?.user?.organizationId) return { messages: [], ourNumber: "" };

  // We need to fetch messages where the contact is either the sender or receiver
  const messages = await prisma.smsMessage.findMany({
    where: {
      organizationId: session.user.organizationId,
      OR: [
        { fromNumber: contactNumber, direction: 'INBOUND' },
        { toNumber: contactNumber, direction: 'OUTBOUND' }
      ]
    },
    orderBy: { sentAt: 'asc' }
  });

  // Figure out which of our numbers is handling this conversation
  // We can pick it from the latest message
  let ourNumber = "";
  if (messages.length > 0) {
    const lastMsg = messages[messages.length - 1];
    ourNumber = lastMsg.direction === 'INBOUND' ? lastMsg.toNumber : lastMsg.fromNumber;
  } else {
    // If no messages exist (shouldn't happen here, but fallback)
    const firstNum = await prisma.phoneNumber.findFirst({
      where: { organizationId: session.user.organizationId }
    });
    ourNumber = firstNum?.number || "";
  }

  const contact = await prisma.contact.findFirst({
    where: { organizationId: session.user.organizationId, phone: contactNumber }
  });

  return { messages, ourNumber, contact };
}

export async function sendSms(toNumber: string, fromNumber: string, text: string) {
  const session = await auth();
  if (!session?.user?.organizationId) return { error: "Unauthorized" };

  try {
    // 1. Send via Telnyx
    const response = await telnyx.messages.create({
      from: fromNumber,
      to: toNumber,
      text: text
    });

    // 2. Save to DB
    await prisma.smsMessage.create({
      data: {
        telnyxMessageId: response.data.id || `pending_${Date.now()}`,
        direction: 'OUTBOUND',
        body: text,
        fromNumber: fromNumber,
        toNumber: toNumber,
        organizationId: session.user.organizationId,
        userId: session.user.id
      }
    });

    revalidatePath(`/dashboard/messages/${encodeURIComponent(toNumber)}`);
    return { success: true };
  } catch (error: any) {
    console.error("[Send SMS Error]", error);
    return { error: "Failed to send message" };
  }
}
