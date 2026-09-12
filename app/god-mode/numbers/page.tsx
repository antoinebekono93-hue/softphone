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
        include: {
          pricingPlan: {
            select: { id: true, name: true, hasCallRouting: true, hasTransfer: true, hasRecording: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const organizations = await prisma.organization.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return <NumbersClient existingNumbers={numbers} organizations={organizations} />;
}
