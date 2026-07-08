"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Phone, MessageSquare, MessageCircle, Bot, Search, Bell } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export function TopNavbar({
  organizationName,
  walletBalance,
}: {
  organizationName?: string | null;
  walletBalance?: number;
}) {
  const pathname = usePathname();
  const { language, setLanguage, t } = useLanguage();

  // Determine active module based on URL
  const getActiveModule = () => {
    if (pathname.includes("/dashboard/sms")) return "sms";
    if (pathname.includes("/dashboard/whatsapp")) return "whatsapp";
    if (pathname.includes("/dashboard/ai") || pathname.includes("/dashboard/rag") || pathname.includes("/dashboard/voice") || pathname.includes("/dashboard/tts")) return "ai";
    return "phone"; // Default
  };

  const activeModule = getActiveModule();

  const modules = [
    { id: "phone", name: "Téléphone", icon: Phone, href: "/dashboard" },
    { id: "sms", name: "SMS", icon: MessageSquare, href: "/dashboard/sms" },
    { id: "whatsapp", name: "WhatsApp", icon: MessageCircle, href: "/dashboard/whatsapp-campaigns" },
    { id: "ai", name: "IA & Agents", icon: Bot, href: "/dashboard/ai-team" },
  ];

  return (
    <header className="fixed top-0 inset-x-0 h-16 bg-[var(--bg-base)] border-b border-[var(--border-subtle)] z-40 flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-8 h-full w-full max-w-full">
        {/* Logo */}
        <div className="flex items-center gap-3 font-bold text-[var(--text-primary)] shrink-0">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)] text-[var(--accent-foreground)] flex items-center justify-center font-bold text-sm shadow-sm">
            {organizationName?.charAt(0) || "A"}
          </div>
          <span className="hidden md:inline-block">Antigravité</span>
        </div>

        {/* Global Search */}
        <div className="hidden md:flex relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
          <input 
            type="text" 
            placeholder="Rechercher..." 
            className="w-full pl-10 pr-4 py-2 bg-[var(--bg-surface-hover)] border-none rounded-xl text-sm focus:ring-1 focus:ring-[var(--border-glow)]"
          />
        </div>

        {/* Horizontal Navigation (Modules) */}
        <nav className="hidden md:flex items-center gap-1 h-full mx-auto absolute left-1/2 -translate-x-1/2">
          {modules.map((m) => {
            const isActive = activeModule === m.id;
            const Icon = m.icon;
            return (
              <Link 
                key={m.id}
                href={m.href}
                className={`relative flex items-center gap-2 px-4 h-full transition-colors text-sm font-medium ${
                  isActive 
                    ? "text-[var(--text-primary)]" 
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]/50"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[var(--accent-primary)]' : ''}`} />
                {m.name}
                {isActive && (
                  <div className="absolute bottom-0 inset-x-0 h-[2px] bg-[var(--accent-primary)] rounded-t-full"></div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-4 ml-auto shrink-0">
          {/* Wallet Balance (Moved from Sidebar) */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-sm">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Wallet</span>
            <span className="text-sm font-bold text-[var(--text-primary)]">${walletBalance?.toFixed(2) || "0.00"}</span>
          </div>

          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value as any)}
            className="hidden md:block bg-[var(--bg-surface-hover)] text-sm border-none rounded-lg focus:ring-1 focus:ring-[var(--border-glow)] px-2 py-1 outline-none cursor-pointer"
          >
            <option value="fr">FR</option>
            <option value="en">EN</option>
            <option value="ar">AR</option>
          </select>

          <button className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] rounded-full transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-[var(--bg-base)]"></span>
          </button>
          
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-violet-500 shadow-sm cursor-pointer border-2 border-[var(--bg-base)]"></div>
        </div>
      </div>
    </header>
  );
}
