"use client";

import Link from "next/link";
import { useState } from "react";
import EmbeddedSignupButton from "../whatsapp/EmbeddedSignupButton";

interface SidebarProps {
  onNavigate: (view: string) => void;
  currentView: string;
}

export default function Sidebar({ onNavigate, currentView }: SidebarProps) {
  const [notification, setNotification] = useState<string | null>(null);

  const handleToken = async (token: string) => {
    // This token will be sent to the backend route we will create soon
    console.log("Token reçu en frontend, prêt à être envoyé au backend Telnyx:", token);
    setNotification("Jeton d'authentification récupéré avec succès !");
    setTimeout(() => setNotification(null), 3000);
  };

  // Replace these with environment variables once you create your Meta App
  const metaAppId = process.env.NEXT_PUBLIC_META_APP_ID || "VOTRE_APP_ID";
  const metaConfigId = process.env.NEXT_PUBLIC_META_CONFIG_ID || "VOTRE_CONFIG_ID";

  return (
    <aside className="w-64 bg-[#0a0a0f]/80 backdrop-blur-xl border-r border-white/5 h-screen sticky top-0 flex flex-col z-10">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-2 mb-8 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-violet-500 flex items-center justify-center text-white font-bold text-lg">
            A
          </div>
          <span className="text-xl font-extrabold tracking-tight text-white">Antigravity</span>
        </Link>

        <nav className="space-y-1">
          <button
            onClick={() => onNavigate('inbox')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              currentView === 'inbox' 
                ? "bg-white/10 text-white" 
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            Boîte Partagée
          </button>

          <button
            onClick={() => onNavigate('crm')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              currentView === 'crm' 
                ? "bg-white/10 text-white" 
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
            CRM Pipeline
          </button>

          <button
            onClick={() => onNavigate('campaigns')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              currentView === 'campaigns' 
                ? "bg-white/10 text-white" 
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
            Campagnes (Broadcast)
          </button>
          
          <button
            onClick={() => onNavigate('softphone')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              currentView === 'softphone' 
                ? "bg-white/10 text-white" 
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            Softphone App
          </button>
          
          <button
            onClick={() => onNavigate('settings')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              currentView === 'settings' 
                ? "bg-white/10 text-white" 
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
            Paramètres
          </button>
        </nav>
      </div>

      {notification && (
        <div className="mx-4 mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-xs font-bold text-center">
          {notification}
        </div>
      )}

      <div className="mt-auto p-6 border-t border-white/5 bg-white/[0.02]">
        <div className="mb-2">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Intégrations (Client)
          </h4>
          <p className="text-xs text-gray-400 mb-4 leading-relaxed">
            Vos clients utilisent ce bouton pour lier leur numéro WhatsApp à votre logiciel de support.
          </p>
          <EmbeddedSignupButton 
            appId={metaAppId}
            configId={metaConfigId}
            onSuccess={handleToken} 
          />
        </div>
      </div>
    </aside>
  );
}
