"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Inbox, 
  Phone, 
  BarChart2, 
  Users, 
  Bot, 
  MessageSquare, 
  Hash, 
  Wifi, 
  ShieldCheck, 
  GitMerge, 
  UsersRound, 
  BookUser,
  Workflow,
  Settings, 
  CreditCard,
  LogOut,
  Shield,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  Menu,
  X,
  Sun,
  Moon
} from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";

export function DashboardSidebar({
  organizationName,
  planName,
  planStatus,
  userEmail,
  walletBalance
}: {
  organizationName?: string | null;
  planName?: string | null;
  planStatus?: string | null;
  userEmail?: string | null;
  walletBalance?: number;
}) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  // Grouped Navigation
  const navGroups = [
    {
      title: "Services de base",
      items: [
        { name: "Aperçu du projet", href: "/dashboard", icon: Home },
        { name: "Contacts", href: "/dashboard/contacts", icon: BookUser },
        { name: "Séquences", href: "/dashboard/sequences", icon: Workflow },
        { name: "Boîte de réception", href: "/dashboard/inbox", icon: Inbox },
        { name: "Softphone", href: "/dashboard/softphone", icon: Phone },
        { name: "Analyse & Rapports", href: "/dashboard/analytics", icon: BarChart2 },
        { name: "CRM (Pipeline)", href: "/dashboard/crm", icon: Users },
      ]
    },
    {
      title: "Centre d'applications",
      items: [
        { name: "Agents Vocaux IA", href: "/dashboard/ai-agents", icon: Bot },
        { name: "Campagnes SMS", href: "/dashboard/sms", icon: MessageSquare },
        { name: "Campagnes WhatsApp", href: "/dashboard/whatsapp-campaigns", icon: MessageSquare },
        { name: "Numéros de téléphone", href: "/dashboard/numbers", icon: Hash },
        { name: "Connectivité IoT", href: "/dashboard/iot", icon: Wifi },
        { name: "Vérification OTP", href: "/dashboard/verify", icon: ShieldCheck },
      ]
    },
    {
      title: "Configuration",
      items: [
        { name: "SVI & Routage", href: "/dashboard/ivr", icon: GitMerge },
        { name: "Équipe", href: "/dashboard/team", icon: UsersRound },
        { name: "Paramètres", href: "/dashboard/settings", icon: Settings },
        { name: "Facturation & Wallet", href: "/dashboard/billing", icon: CreditCard },
        { name: "Administration", href: "/dashboard/admin", icon: Shield },
      ]
    }
  ];

  const closeMobile = () => setIsMobileOpen(false);

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 glass-panel rounded-none border-t-0 border-x-0 flex items-center justify-between px-4 z-40">
        <div className="font-bold text-[var(--text-primary)] flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-500 text-white flex items-center justify-center font-bold text-sm shadow-[0_0_15px_rgba(0,212,255,0.3)]">
            {organizationName?.charAt(0) || "A"}
          </div>
          Antigravité
        </div>
        <button onClick={() => setIsMobileOpen(true)} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm transition-opacity"
          onClick={closeMobile}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`fixed md:relative top-0 left-0 h-screen z-50 flex flex-col glass-panel rounded-none border-y-0 border-l-0 transition-all duration-300 ease-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} 
          ${isCollapsed ? 'w-[72px]' : 'w-[260px]'}
        `}
      >
        {/* Mobile Close Button inside Sidebar */}
        <button 
          onClick={closeMobile} 
          className="md:hidden absolute top-4 right-4 text-[var(--text-secondary)] p-1 hover:bg-[var(--bg-surface-hover)] rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top section: Org Info */}
        <div className={`p-4 border-b border-[var(--border-subtle)] flex items-center h-[72px] ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {isCollapsed ? (
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-500 text-white flex items-center justify-center font-bold text-lg shadow-[0_0_15px_rgba(0,212,255,0.3)]">
              {organizationName?.charAt(0) || "A"}
            </div>
          ) : (
            <div className="flex items-center justify-between w-full cursor-pointer hover:bg-[var(--bg-surface-hover)] p-2 -m-2 rounded-xl transition-all">
               <div className="flex items-center gap-3 overflow-hidden">
                 <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-500 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-[0_0_15px_rgba(0,212,255,0.3)]">
                   {organizationName?.charAt(0) || "A"}
                 </div>
                 <div className="truncate">
                   <div className="font-semibold text-sm text-[var(--text-primary)] truncate">{organizationName || "Antigravité"}</div>
                   <div className="text-xs text-cyan-400 truncate">{planName || "PLAN GRATUIT"}</div>
                 </div>
               </div>
               <ChevronDown className="w-4 h-4 text-[var(--text-secondary)] shrink-0 hidden md:block" />
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-8">
          {navGroups.map((group, idx) => (
            <div key={idx}>
              {!isCollapsed && (
                <div className="px-3 mb-3 text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">
                  {group.title}
                </div>
              )}
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        onClick={() => setIsMobileOpen(false)}
                        className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                          isActive 
                            ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(0,212,255,0.05)]' 
                            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]'
                        } ${isCollapsed ? 'justify-center' : ''}`}
                        title={isCollapsed ? item.name : undefined}
                      >
                        <Icon className={`w-5 h-5 shrink-0 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110 group-hover:text-cyan-400'}`} />
                        {!isCollapsed && <span className="truncate font-medium">{item.name}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Wallet Balance */}
        {!isCollapsed && (
          <div className="mx-4 mb-4 p-4 rounded-xl bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] flex justify-between items-center relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-500/10 blur-xl rounded-full"></div>
            <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider z-10">Wallet</span>
            <span className="text-sm font-bold text-[var(--text-primary)] z-10">${walletBalance?.toFixed(2) || "0.00"}</span>
          </div>
        )}

        {/* Bottom section */}
        <div className="p-4 border-t border-[var(--border-subtle)] flex flex-col gap-2">
          <button 
            onClick={toggleTheme}
            className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] transition-colors ${isCollapsed ? 'justify-center' : ''}`}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 shrink-0" /> : <Moon className="w-5 h-5 shrink-0" />}
            {!isCollapsed && <span className="font-medium">{theme === 'dark' ? 'Mode Clair' : 'Mode Sombre'}</span>}
          </button>

          <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-red-500 transition-colors cursor-pointer ${isCollapsed ? 'justify-center' : ''}`}>
             <LogOut className="w-5 h-5 shrink-0" />
             {!isCollapsed && <span className="truncate font-medium">Déconnexion</span>}
          </div>
          
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`hidden md:flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] transition-colors ${isCollapsed ? 'justify-center' : ''}`}
          >
            {isCollapsed ? <PanelLeftOpen className="w-5 h-5 shrink-0" /> : <PanelLeftClose className="w-5 h-5 shrink-0" />}
            {!isCollapsed && <span className="font-medium">Réduire la barre</span>}
          </button>
        </div>
      </div>
    </>
  );
}
