"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LogOut } from "lucide-react";

export function GodModeSidebar() {
  const pathname = usePathname();

  const navItems = [
    { label: "Core", isHeader: true },
    { label: "Overview", href: "/god-mode" },
    { label: "Tenants (Organizations)", href: "/god-mode/tenants" },
    { label: "Global Users", href: "/god-mode/users" },
    
    { label: "Monetization", isHeader: true, mt: true },
    { label: "Dynamic Plans", href: "/god-mode/plans" },
    { label: "Billing & Wallet", href: "/god-mode/billing" },
    { label: "Tarifs & Marges", href: "/god-mode/pricing" },
    
    { label: "Telecom Engine", isHeader: true, mt: true },
    { label: "Telnyx API Control", href: "/god-mode/telnyx" },
    { label: "Number Inventory", href: "/god-mode/numbers" },
    { label: "SMS / Messaging", href: "/god-mode/messaging" },
    { label: "Voice / AI Agents", href: "/god-mode/voice" },
    { label: "eSIM & IoT", href: "/god-mode/esim" },
  ];

  return (
    <aside className="w-64 glass-panel rounded-none border-y-0 border-l-0 border-r border-red-500/20 flex flex-col z-10">
      <div className="p-6 flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-orange-600 shadow-[0_0_20px_rgba(220,38,38,0.4)] flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
        <span className="font-bold text-xl tracking-tight text-[var(--text-primary)]">GOD MODE</span>
      </div>

      <nav className="flex flex-col gap-1 px-4 flex-1 overflow-y-auto">
        {navItems.map((item, idx) => {
          if (item.isHeader) {
            return (
              <div key={idx} className={`text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2 px-2 ${item.mt ? 'mt-6' : 'mt-2'}`}>
                {item.label}
              </div>
            );
          }

          // Strict equality to highlight exact path
          const isActive = pathname === item.href;
          
          return (
            <Link 
              key={idx} 
              href={item.href!} 
              className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive ? "bg-red-500/10 text-red-500 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.05)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]"}`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[var(--border-subtle)] flex flex-col gap-2">
         <div className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] transition-colors">
            <span className="font-medium">Thème</span>
            <ThemeToggle />
         </div>
         <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] transition-colors">
            <LogOut className="w-5 h-5 shrink-0" />
            <span className="font-medium">Exit to App</span>
         </Link>
      </div>
    </aside>
  );
}
