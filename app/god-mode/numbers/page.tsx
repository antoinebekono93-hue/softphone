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

  return <NumbersClient existingNumbers={numbers} />;
}
