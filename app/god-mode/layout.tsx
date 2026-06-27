import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

import { GodModeSidebar } from "./GodModeSidebar";

export const metadata = {
  title: "God Mode | Control Center",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function GodModeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Uncomment in production to lock the route!
  /*
  if (!session?.user || !session.user.isSuperAdmin) {
    redirect("/login");
  }
  */

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] flex">
      <GodModeSidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-[var(--bg-base)] relative">
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-500/5 blur-[150px] rounded-full pointer-events-none"></div>
         <div className="p-10 max-w-6xl mx-auto">
            {children}
         </div>
      </main>
    </div>
  );
}
