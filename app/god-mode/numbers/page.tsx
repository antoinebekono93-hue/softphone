import { prisma } from "@/lib/prisma";
import { NumbersClient } from "./NumbersClient";

export const metadata = {
  title: "Numbers Inventory | God Mode",
};

export default async function GodModeNumbersPage() {
  const numbers = await prisma.phoneNumber.findMany({
    include: { organization: true },
    orderBy: { createdAt: "desc" },
  });

  const organizations = await prisma.organization.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return <NumbersClient existingNumbers={numbers} organizations={organizations} />;
}
