import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import LiveKitClient from "./LiveKitClient";

export default async function LiveKitPage() {
  const session = await auth();
  
  const phoneNumbers = await prisma.phoneNumber.findMany({
    where: { organizationId: session?.user?.organizationId }
  });

  return <LiveKitClient phoneNumbers={phoneNumbers} />;
}
