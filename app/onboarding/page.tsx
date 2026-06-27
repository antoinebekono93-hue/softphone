import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function OnboardingRouter() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Check if they already have a number
  const user = await prisma.user.findUnique({ 
    where: { id: session.user.id },
    include: { organization: { include: { phoneNumbers: true } } }
  });

  if (user?.organization?.phoneNumbers && user.organization.phoneNumbers.length > 0) {
    // They already have a number, onboarding is complete
    redirect("/dashboard/softphone");
  }

  // Otherwise, go to pick a number
  redirect("/onboarding/number");
}
