import { SoftphoneWorkspace } from "@/components/softphone/SoftphoneWorkspace";
import { PageHeader } from "@/components/ui/page-header";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function SoftphonePage() {
  const session = await auth();
  if (!session?.user?.organizationId) {
    redirect("/login");
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:p-8 max-w-7xl mx-auto w-full h-full min-h-0">
      <PageHeader
        title="Softphone"
        description="Passez vos appels, consultez l'historique et discutez avec l'IA."
      />

      <div className="flex-1 min-h-0 flex">
        <SoftphoneWorkspace />
      </div>
    </div>
  );
}
