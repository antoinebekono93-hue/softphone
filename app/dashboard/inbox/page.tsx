import { auth } from "@/auth";
import { redirect } from "next/navigation";
import InboxClient from "./InboxClient";

export const metadata = {
  title: "Boîte de réception Omnicanale | Antigravity",
};

export default async function InboxPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  const orgId = session.user.organizationId;

  return (
    <div className="h-full w-full flex overflow-hidden bg-[var(--bg-base)]">
      <InboxClient organizationId={orgId} />
    </div>
  );
}
