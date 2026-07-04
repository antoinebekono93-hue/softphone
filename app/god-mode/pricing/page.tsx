import { prisma } from "@/lib/prisma";
import { PricingSettingsClient } from "./PricingSettingsClient";
import { getSystemSettings } from "@/lib/settings";

export const metadata = {
  title: "Tarifs et Marges | God Mode",
};

export default async function GodModePricingPage() {
  const settings = await getSystemSettings();

  return (
    <div className="p-8 max-w-5xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-[var(--text-primary)]">Tarifs et Marges Opérateur</h1>
        <p className="text-[var(--text-secondary)]">
          Gérez les tarifs de vente et les marges appliquées à vos clients sur l'ensemble de la plateforme.
        </p>
      </div>

      <PricingSettingsClient initialSettings={settings} />
    </div>
  );
}
