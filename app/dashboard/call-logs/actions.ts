"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function getCallLogs(limit: number = 50, offset: number = 0) {
  const session = await auth();
  if (!session?.user?.organizationId) return { logs: [], total: 0 };

  const [logs, total] = await Promise.all([
    prisma.callLog.findMany({
      where: { organizationId: session.user.organizationId },
      orderBy: { startedAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.callLog.count({
      where: { organizationId: session.user.organizationId },
    }),
    prisma.contact.findMany({
      where: { organizationId: session.user.organizationId }
    })
  ]);

  const logsWithContacts = logs.map(log => {
    const externalNumber = log.direction === 'OUTBOUND' ? log.toNumber : log.fromNumber;
    const contact = contacts.find(c => c.phone === externalNumber);
    return { ...log, contact };
  });

  return { logs: logsWithContacts, total };
}
