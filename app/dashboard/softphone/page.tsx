import { SoftphoneWorkspace } from "@/components/softphone/SoftphoneWorkspace";
import { TelnyxProvider } from "@/contexts/TelnyxContext";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function SoftphonePage() {
  const session = await auth();
  if (!session?.user?.organizationId) {
    redirect("/login");
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 h-full flex flex-col">
      <div>
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">Softphone</h1>
        <p className="text-[var(--text-secondary)] mt-2">Passez vos appels, consultez l'historique et discutez avec l'IA.</p>
      </div>

      <div className="flex-1 flex">
        <TelnyxProvider>
          <SoftphoneWorkspace />
        </TelnyxProvider>
      </div>
    </div>
  );
}
