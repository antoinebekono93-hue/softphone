import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Phone, Users, Wallet, Activity } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.organizationId) {
    redirect("/login");
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 h-full flex flex-col">
      <div>
        <h1 className="text-3xl font-extrabold text-[var(--text-primary)]">
          Bonjour, {session.user.name?.split(' ')[0] || "Admin"} 👋
        </h1>
        <p className="text-[var(--text-secondary)] mt-2">Voici l'aperçu de votre espace de travail Antigravity.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Stats Cards */}
        <div className="glass-panel p-6 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-[var(--accent-cyan)] flex items-center justify-center">
              <Phone className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-secondary)]">Appels aujourd'hui</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">0</p>
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 text-[var(--accent-violet)] flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-secondary)]">Contacts totaux</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">---</p>
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-secondary)]">Solde Wallet</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">$0.00</p>
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-secondary)]">Statut système</p>
              <p className="text-lg font-bold text-emerald-500">Opérationnel</p>
            </div>
          </div>
        </div>
      </div>

      {/* Getting Started Section */}
      <div className="glass-panel flex-1 p-8 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(0,212,255,0.3)]">
          <Activity className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Bienvenue sur Antigravity</h2>
        <p className="text-[var(--text-secondary)] max-w-lg mb-8">
          Votre plateforme cloud de communication est prête. Utilisez la barre latérale gauche pour naviguer vers le Softphone, le CRM, ou gérer vos campagnes.
        </p>
      </div>
    </div>
  );
}
