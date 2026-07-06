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
  Moon,
  Mic2,
  Sparkles,
  Server,
  Brain,
  Terminal
} from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";

export function DashboardSidebar({
  organizationName,
  planName,
  planStatus,
  userEmail,
  walletBalance,
  isSuperAdmin
}: {
  organizationName?: string | null;
  planName?: string | null;
  planStatus?: string | null;
  userEmail?: string | null;
  walletBalance?: number;
  isSuperAdmin?: boolean;
}) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  // Grouped Navigation by Module
  const getActiveModule = () => {
    if (pathname.includes("/dashboard/sms")) return "sms";
    if (pathname.includes("/dashboard/whatsapp") || pathname.includes("/dashboard/pipeline")) return "whatsapp";
    if (pathname.includes("/dashboard/ai") || pathname.includes("/dashboard/rag") || pathname.includes("/dashboard/voice") || pathname.includes("/dashboard/tts")) return "ai";
    return "phone"; // Default
  };

  const activeModule = getActiveModule();

  const allNavGroups = {
    phone: [
      {
        title: "Téléphone & CRM",
        items: [
          { name: "Tableau de bord", href: "/dashboard", icon: Home },
          { name: "Softphone", href: "/dashboard/softphone", icon: Phone },
          { name: "Contacts", href: "/dashboard/contacts", icon: BookUser },
          { name: "Séquences d'appels", href: "/dashboard/sequences", icon: Workflow },
          { name: "Boîte de réception", href: "/dashboard/inbox", icon: Inbox },
          { name: "Revenus & Churn", href: "/dashboard/analytics/revenue", icon: BarChart2 },
        ]
      },
      {
        title: "Configuration",
        items: [
          { name: "Numéros de téléphone", href: "/dashboard/numbers", icon: Hash },
          { name: "SVI & Routage", href: "/dashboard/ivr", icon: GitMerge },
          { name: "Paramètres", href: "/dashboard/settings", icon: Settings },
        ]
      }
    ],
    sms: [
      {
        title: "Messagerie SMS",
        items: [
          { name: "Campagnes SMS", href: "/dashboard/sms", icon: MessageSquare },
          { name: "Boîte de réception", href: "/dashboard/sms-inbox", icon: Inbox },
          { name: "Profils SMS", href: "/dashboard/sms/profiles", icon: Settings },
          { name: "Modèles (Bientôt)", href: "/dashboard/sms", icon: BookUser },
        ]
      }
    ],
    whatsapp: [
      {
        title: "CRM & Ventes",
        items: [
          { name: "Pipeline de Ventes", href: "/dashboard/pipeline", icon: GitMerge },
          { name: "Contacts", href: "/dashboard/contacts", icon: BookUser },
        ]
      },
      {
        title: "WhatsApp Business",
        items: [
          { name: "Séquences (Flows)", href: "/dashboard/whatsapp/flows", icon: Workflow },
          { name: "Campagnes WhatsApp", href: "/dashboard/whatsapp-campaigns", icon: MessageSquare },
          { name: "Chat WhatsApp", href: "/dashboard/whatsapp-inbox", icon: Inbox },
          { name: "Modèles (Templates)", href: "/dashboard/whatsapp/templates", icon: BookUser },
          { name: "Paramètres API", href: "/dashboard/whatsapp/connect", icon: ShieldCheck },
        ]
      }
    ],
    ai: [
      {
        title: "Employés Virtuels",
        items: [
          { name: "Mes Agents Vocaux", href: "/dashboard/ai-agents", icon: Bot },
          { name: "Mémoire & RAG", href: "/dashboard/rag-memory", icon: Brain },
          { name: "Playground IA", href: "/dashboard/ai-playground", icon: Terminal },
        ]
      },
      {
        title: "Outils Avancés",
        items: [
          { name: "Laboratoire Vocal", href: "/dashboard/voice-lab", icon: Sparkles },
          { name: "Studio Vocal (TTS)", href: "/dashboard/tts", icon: Mic2 },
        ]
      }
    ]
  };

  const navGroups = allNavGroups[activeModule as keyof typeof allNavGroups] || allNavGroups.phone;

  const closeMobile = () => setIsMobileOpen(false);

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 glass-panel rounded-none border-t-0 border-x-0 flex items-center justify-between px-4 z-40">
        <div className="font-bold text-[var(--text-primary)] flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)] text-[var(--accent-foreground)] flex items-center justify-center font-bold text-sm shadow-sm">
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
        className={`fixed md:relative top-0 left-0 h-screen z-50 flex flex-col bg-[var(--bg-base)] border-r border-[var(--border-subtle)] transition-all duration-300 ease-out
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

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-8 mt-12 md:mt-0">
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
                            ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] font-semibold shadow-sm border border-[var(--border-subtle)]' 
                            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]'
                        } ${isCollapsed ? 'justify-center' : ''}`}
                        title={isCollapsed ? item.name : undefined}
                      >
                        <Icon className={`w-5 h-5 shrink-0 transition-transform duration-200 ${isActive ? 'scale-110 text-[var(--text-primary)]' : 'group-hover:scale-110 group-hover:text-[var(--text-primary)]'}`} />
                        {!isCollapsed && <span className="truncate">{item.name}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

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
