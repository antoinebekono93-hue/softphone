import { SoftphoneExperience } from "@/components/softphone/SoftphoneExperience";
import { PageHeader } from "@/components/ui/page-header";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function SoftphonePage() {
  const session = await auth();
  if (!session?.user?.organizationId) {
    redirect("/login");
  }

  return (
    <div className="flex flex-col gap-2 md:gap-4 p-0 md:p-8 max-w-7xl mx-auto w-full h-full min-h-0">
      <div className="hidden md:block">
        <PageHeader
          title="Buster Call"
          description="Passez vos appels, consultez l'historique et discutez avec l'IA."
        />
      </div>

      <SoftphoneExperience />
    </div>
  );
}
