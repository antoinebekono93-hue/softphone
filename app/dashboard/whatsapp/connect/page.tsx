import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ConnectClient from "./ConnectClient";

export const metadata = {
  title: "WhatsApp Connect | Antigravity",
};

export default async function WhatsAppConnectPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");

  // Fetch phone numbers owned by the org
  const phoneNumbers = await prisma.phoneNumber.findMany({
    where: { organizationId: session.user.organizationId },
    select: { id: true, number: true, friendlyName: true }
  });

  // Fetch existing WhatsApp account for this org
  const account = await prisma.whatsAppAccount.findUnique({
    where: { organizationId: session.user.organizationId }
  });

  // Serialize to avoid Next.js Date object passing error
  const whatsappAccount = account ? JSON.parse(JSON.stringify(account)) : null;

  return (
    <div className="h-full w-full bg-[var(--bg-base)] overflow-y-auto">
      <ConnectClient 
        phoneNumbers={phoneNumbers} 
        existingAccount={whatsappAccount} 
      />
    </div>
  );
}
