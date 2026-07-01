import { getTenantsWallets, getGlobalTransactions } from "./actions";
import { BillingDashboardClient } from "./BillingDashboardClient";

export default async function GodModeBillingPage() {
  const [walletsRes, txRes] = await Promise.all([
    getTenantsWallets(),
    getGlobalTransactions()
  ]);

  return (
    <BillingDashboardClient 
      initialWallets={walletsRes.data || []}
      initialTransactions={txRes.data || []}
    />
  );
}
