import { prisma } from "@/lib/prisma";
import { NumbersClient } from "./NumbersClient";

export const metadata = {
  title: "Numbers Inventory | God Mode",
};

export const dynamic = "force-dynamic";

export default async function GodModeNumbersPage() {
  const numbers = await prisma.phoneNumber.findMany({
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          pricingPlan: {
            select: { id: true, name: true, hasCallRouting: true, hasTransfer: true, hasRecording: true },
          },
        },
      },
      // Read only to detect a cross-tenant assignee (case D). Never used to
      // repair ownership: a legacy owner is never guessed.
      assignedUser: { select: { id: true, organizationId: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const organizations = await prisma.organization.findMany({
    select: { id: true, name: true, users: { select: { id: true, name: true, email: true } } },
    orderBy: { name: "asc" },
  });

  return <NumbersClient existingNumbers={numbers} organizations={organizations} />;
}
