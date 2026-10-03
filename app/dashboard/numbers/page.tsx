import { auth } from "@/auth";
import { getCurrentAccountContext } from "@/lib/account-context";
import { getNumbers, getUsers } from "./actions";
import { NumbersClient } from "./NumbersClient";

export const metadata = {
  title: "Phone Numbers | Antigravity",
};

export default async function NumbersPage() {
  const session = await auth();
  const account = session?.user?.id ? await getCurrentAccountContext(session.user.id) : null;

  if (!account?.organizationId) {
    return (
      <div className="p-4 md:p-8 max-w-6xl mx-auto w-full">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 text-[var(--text-primary)]">
          Phone Numbers
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Aucun numéro : votre compte n’est rattaché à aucune organisation.
        </p>
      </div>
    );
  }

  // A failed query must never be rendered as an empty inventory. Distinguishing
  // "no numbers" from "could not read them" is the whole point of the audit.
  const [numbers, users] = await Promise.all([
    getNumbers(account.organizationId).catch((error) => {
      console.error("[dashboard/numbers] Failed to load numbers", error);
      return null;
    }),
    getUsers().catch((error) => {
      console.error("[dashboard/numbers] Failed to load users", error);
      return [];
    }),
  ]);

  if (numbers === null) {
    return (
      <div className="p-4 md:p-8 max-w-6xl mx-auto w-full">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4 text-[var(--text-primary)]">
          Phone Numbers
        </h1>
        <p className="text-sm text-red-400 border border-red-500/20 bg-red-500/10 rounded-xl p-4">
          Impossible de charger vos numéros pour le moment. Réessayez dans un instant.
        </p>
      </div>
    );
  }

  return <NumbersClient initialNumbers={numbers} users={users} />;
}