"use client";

import { useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import CampaignDashboard from "@/components/whatsapp/campaigns/CampaignDashboard";
import CrmApp from "@/components/crm/CrmApp";

export default function DashboardPage() {
  // Architecture Single Page (SPA) avec state pour changer de vue
  const [currentView, setCurrentView] = useState("inbox");

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-100 flex overflow-hidden">
      {/* Barre latérale persistante */}
      <Sidebar onNavigate={setCurrentView} currentView={currentView} />
      
      {/* Zone de contenu principale dynamique */}
      <main className="flex-1 overflow-y-auto relative bg-[#0a0a0f]">
        <div className="p-8 max-w-7xl mx-auto h-full">
          
          {/* VUE 1 : BOÎTE PARTAGÉE */}
          {currentView === "inbox" && (
            <div className="animate-in fade-in duration-300 h-full flex flex-col">
              <div className="mb-8">
                <h1 className="text-3xl font-extrabold mb-2 text-white tracking-tight">Boîte Partagée</h1>
                <p className="text-gray-400">Gérez toutes vos communications WhatsApp au même endroit.</p>
              </div>
              
              <div className="flex-1 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center min-h-[500px]">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/10">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">Aucun message pour le moment</h3>
                  <p className="text-gray-400 max-w-sm mx-auto text-sm leading-relaxed">
                    Une fois le compte WhatsApp Business connecté depuis la barre latérale, les messages entrants apparaîtront ici.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* VUE 2 : SOFTPHONE */}
          {currentView === "softphone" && (
            <div className="animate-in fade-in duration-300 h-full flex flex-col">
              <div className="mb-8">
                <h1 className="text-3xl font-extrabold mb-2 text-white tracking-tight">Softphone</h1>
                <p className="text-gray-400">Passez et recevez vos appels voix via WebRTC.</p>
              </div>
              
              <div className="flex-1 bg-white/5 rounded-2xl border border-white/10 p-6">
                <p className="text-gray-400">L'interface du Softphone (Clavier) sera intégrée ici prochainement.</p>
              </div>
            </div>
          )}

          {/* VUE ODOO CRM */}
          {currentView === "crm" && (
            <div className="animate-in fade-in duration-300 h-full flex flex-col">
              <CrmApp />
            </div>
          )}

          {/* VUE 4 : CAMPAGNES */}
          {currentView === "campaigns" && (
            <div className="animate-in fade-in duration-300 h-full flex flex-col">
              <CampaignDashboard />
            </div>
          )}

          {/* VUE 3 : PARAMÈTRES */}
          {currentView === "settings" && (
            <div className="animate-in fade-in duration-300 h-full flex flex-col">
              <div className="mb-8">
                <h1 className="text-3xl font-extrabold mb-2 text-white tracking-tight">Paramètres</h1>
                <p className="text-gray-400">Configurez votre environnement.</p>
              </div>
              
              <div className="bg-white/5 rounded-2xl border border-white/10 p-6 max-w-2xl">
                <h3 className="text-lg font-medium text-white mb-4">Configuration Meta & Telnyx</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Meta App ID</label>
                    <input type="text" disabled value="Configuré via .env" className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-gray-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Meta Config ID</label>
                    <input type="text" disabled value="Configuré via .env" className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-gray-500" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
