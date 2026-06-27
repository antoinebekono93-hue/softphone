"use client";

import { useState } from "react";
import { ShieldCheck, Plus, CheckCircle, Activity, LayoutList, ListOrdered, FileCode2 } from "lucide-react";

export default function VerifyOtpPage() {
  const [activeTab, setActiveTab] = useState("profiles");

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto w-full">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 text-[var(--text-primary)]">
            Sécurité & <span className="text-gradient">Vérification OTP</span>
          </h1>
          <p className="text-[var(--text-secondary)] text-sm md:text-base">Sécurisez les applications de votre entreprise avec l'authentification à deux facteurs (2FA) par SMS ou Appel.</p>
        </div>
        <button className="w-full md:w-auto btn-primary-gradient flex items-center justify-center gap-2">
          <Plus className="w-5 h-5" />
          Nouveau Profil OTP
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
        <div className="glass-panel p-6 flex items-start justify-between">
          <div>
            <div className="text-[var(--text-secondary)] text-xs font-bold uppercase tracking-wider mb-2">Vérifications (Ce mois)</div>
            <div className="text-3xl md:text-4xl font-bold text-[var(--text-primary)]">1,420</div>
          </div>
          <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-500 shadow-sm">
            <Activity className="w-6 h-6" />
          </div>
        </div>
        <div className="glass-panel p-6 flex items-start justify-between">
          <div>
            <div className="text-[var(--text-secondary)] text-xs font-bold uppercase tracking-wider mb-2">Taux de succès</div>
            <div className="text-3xl md:text-4xl font-bold text-emerald-500">94.5%</div>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-500 shadow-sm">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>
        <div className="glass-panel p-6 flex items-start justify-between">
          <div>
            <div className="text-[var(--text-secondary)] text-xs font-bold uppercase tracking-wider mb-2">Coût Sécurité Estimé</div>
            <div className="text-3xl md:text-4xl font-bold text-cyan-500">$42.60</div>
          </div>
          <div className="p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/20 text-cyan-500 shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="glass-panel flex flex-col overflow-hidden">
        <div className="flex border-b border-[var(--border-subtle)] overflow-x-auto">
          <button 
            className={`px-6 py-4 text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-colors ${activeTab === 'profiles' ? 'text-cyan-500 border-b-2 border-cyan-500 bg-[var(--bg-surface-hover)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'}`}
            onClick={() => setActiveTab('profiles')}
          >
            <LayoutList className="w-4 h-4" /> Profils de Vérification
          </button>
          <button 
            className={`px-6 py-4 text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-colors ${activeTab === 'logs' ? 'text-cyan-500 border-b-2 border-cyan-500 bg-[var(--bg-surface-hover)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'}`}
            onClick={() => setActiveTab('logs')}
          >
            <ListOrdered className="w-4 h-4" /> Logs & Requêtes
          </button>
          <button 
            className={`px-6 py-4 text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-colors ${activeTab === 'api' ? 'text-cyan-500 border-b-2 border-cyan-500 bg-[var(--bg-surface-hover)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'}`}
            onClick={() => setActiveTab('api')}
          >
            <FileCode2 className="w-4 h-4" /> Intégration API
          </button>
        </div>

        <div className="p-0 overflow-x-auto">
          {activeTab === 'profiles' && (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[var(--bg-surface-solid)]/30 border-b border-[var(--border-subtle)] text-[var(--text-secondary)]">
                <tr>
                  <th className="px-6 py-4 font-medium">Nom du Profil</th>
                  <th className="px-6 py-4 font-medium">ID du Profil</th>
                  <th className="px-6 py-4 font-medium">Méthode par défaut</th>
                  <th className="px-6 py-4 font-medium">Expiration du Code</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {[
                   { id: "prof_1234abc", name: "App Mobile (Login)", method: "SMS", expiry: "10 minutes" },
                   { id: "prof_890xyz", name: "Validation Paiement", method: "Appel Vocal", expiry: "5 minutes" },
                ].map((item) => (
                  <tr key={item.id} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                    <td className="px-6 py-4 font-bold text-[var(--text-primary)]">{item.name}</td>
                    <td className="px-6 py-4 font-mono text-xs text-[var(--text-secondary)]">{item.id}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-md ${item.method === 'SMS' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' : 'bg-purple-500/10 text-purple-500 border border-purple-500/20'}`}>
                         {item.method}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[var(--text-secondary)]">{item.expiry}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-cyan-500 font-bold text-sm hover:text-cyan-400 hover:underline">
                        Éditer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          
          {activeTab === 'logs' && (
             <div className="p-12 text-center text-[var(--text-secondary)] flex flex-col items-center justify-center">
                <ListOrdered className="w-12 h-12 mb-4 opacity-30" />
                <p>Les 100 dernières requêtes de vérification OTP apparaîtront ici.</p>
             </div>
          )}

          {activeTab === 'api' && (
             <div className="p-6">
                <p className="text-sm text-[var(--text-secondary)] mb-4">Utilisez ce code d'exemple dans votre Backend pour déclencher l'envoi d'un code OTP à vos utilisateurs via l'infrastructure Telnyx.</p>
                <div className="relative group">
                  <pre className="bg-[#000000] text-[#00d4ff] p-6 rounded-2xl font-mono text-sm overflow-x-auto border border-cyan-500/20 shadow-inner">
                     <code>{`// POST /api/verify
const response = await fetch('https://api.telnyx.com/v2/verifications', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer VOTRE_CLE_API_TELNYX'
  },
  body: JSON.stringify({
    phone_number: "+15551234567",
    verify_profile_id: "prof_1234abc",
    type: "sms" // ou "call"
  })
});

const data = await response.json();
console.log("OTP Envoyé !", data);`}</code>
                  </pre>
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
