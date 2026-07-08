import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AITeamClient from "./AITeamClient";

export default async function AITeamPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");

  const organizationId = session.user.organizationId;

  // Fetch employees
  const employees = await prisma.aIEmployee.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'desc' }
  });

  // Fetch organization phone numbers and whatsapp accounts to show in assignment UI
  const phoneNumbers = await prisma.phoneNumber.findMany({
    where: { organizationId }
  });

  const whatsappAccounts = await prisma.whatsAppAccount.findMany({
    where: { organizationId }
  });

  return (
    <div className="p-6 max-w-7xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-[var(--text-primary)]">Mon Équipe IA</h1>
        <p className="text-[var(--text-secondary)] mt-2">Gérez vos employés virtuels. Assignez-leur des rôles (WhatsApp, Appels) pour automatiser votre support client et vos ventes.</p>
      </div>

      <AITeamClient 
        initialEmployees={employees} 
        phoneNumbers={phoneNumbers}
        whatsappAccounts={whatsappAccounts}
      />
    </div>
  );
}
