"use client";

import { useState } from "react";
import { MessageSquare, Settings, DollarSign, Activity, Globe, Hash, Zap, ShieldAlert } from "lucide-react";

export default function GodModeMessagingPage() {
  const [smartEncoding, setSmartEncoding] = useState(false);
  const [spendLimit, setSpendLimit] = useState(500);

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2 text-[var(--text-primary)] flex items-center gap-3">
           <MessageSquare className="text-cyan-500" />
           Gestion de la Messagerie (SMS/MMS)
        </h1>
        <p className="text-[var(--text-secondary)]">Contrôle global des campagnes, profils de messagerie et limites de dépenses.</p>
      </div>

      {/* KPIs Prioritaires */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-panel p-6 rounded-2xl flex flex-col relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10">
             <Activity className="w-12 h-12" />
           </div>
           <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">Messages Envoyés</span>
           <span className="text-4xl font-bold text-[var(--text-primary)]">1,245,090</span>
           <span className="text-sm text-emerald-500 mt-2 font-medium">+12% ce mois</span>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex flex-col relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10">
             <ShieldAlert className="w-12 h-12" />
           </div>
           <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">Délivrabilité (Livré)</span>
           <span className="text-4xl font-bold text-cyan-500">98.4%</span>
           <div className="flex items-center gap-4 mt-2 text-xs font-medium">
              <span className="text-[var(--text-secondary)]">0.6% Échoué</span>
              <span className="text-[var(--text-secondary)]">1.0% In-Flight</span>
           </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex flex-col relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10">
             <Globe className="w-12 h-12" />
           </div>
           <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">Dépenses par pays (Top 3)</span>
           <div className="space-y-2 mt-2">
              <div className="flex justify-between items-center text-sm">
                 <span className="text-[var(--text-primary)] font-medium">France</span>
                 <span className="text-[var(--text-secondary)] font-mono">$1,240</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                 <span className="text-[var(--text-primary)] font-medium">États-Unis</span>
                 <span className="text-[var(--text-secondary)] font-mono">$890</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                 <span className="text-[var(--text-primary)] font-medium">Canada</span>
                 <span className="text-[var(--text-secondary)] font-mono">$450</span>
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
         {/* Configuration: Messaging Profiles */}
         <div className="glass-panel p-8 rounded-2xl">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-[var(--text-primary)]">
               <Settings className="text-cyan-500" />
               Profils de Messagerie (Messaging Profiles)
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mb-6">Configurez les profils pour différencier les usages marketing et transactionnels, et assurer la conformité A2P 10DLC.</p>
            
            <div className="space-y-4">
               <div className="p-4 border border-[var(--border-subtle)] bg-[var(--bg-surface-hover)] rounded-xl flex justify-between items-center">
                  <div>
                     <h3 className="font-bold text-[var(--text-primary)]">Profil Marketing US</h3>
                     <p className="text-xs text-[var(--text-secondary)]">Campagnes promotionnelles (A2P 10DLC Enregistré)</p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-xs font-bold rounded-full">Actif</span>
               </div>
               <div className="p-4 border border-[var(--border-subtle)] bg-[var(--bg-surface-hover)] rounded-xl flex justify-between items-center">
                  <div>
                     <h3 className="font-bold text-[var(--text-primary)]">Alertes & 2FA Global</h3>
                     <p className="text-xs text-[var(--text-secondary)]">Codes OTP et notifications critiques (Alphanumeric Sender ID)</p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-xs font-bold rounded-full">Actif</span>
               </div>
            </div>
            <button className="mt-6 w-full btn-primary-gradient py-3 text-sm font-bold">
               + Créer un nouveau Profil
            </button>
         </div>

         {/* Outils de Réduction de Coûts */}
         <div className="glass-panel p-8 rounded-2xl flex flex-col">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-[var(--text-primary)]">
               <DollarSign className="text-emerald-500" />
               Outils de Réduction de Coûts
            </h2>

            {/* Smart Encoding */}
            <div className="p-5 border border-[var(--border-subtle)] bg-[var(--bg-surface-hover)] rounded-xl mb-4 flex gap-4 items-start">
               <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-500 shrink-0"><Zap className="w-5 h-5" /></div>
               <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                     <h3 className="font-bold text-[var(--text-primary)]">Smart Encoding</h3>
                     <button 
                        onClick={() => setSmartEncoding(!smartEncoding)}
                        className={`w-12 h-6 rounded-full transition-colors relative ${smartEncoding ? 'bg-cyan-500' : 'bg-gray-600'}`}
                     >
                        <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${smartEncoding ? 'translate-x-6' : ''}`}></div>
                     </button>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">
                     Remplace automatiquement les caractères spéciaux coûteux (ex: guillemets courbes, emojis cachés) par des équivalents GSM-7 pour éviter de diviser la longueur des SMS et de facturer des segments supplémentaires.
                  </p>
               </div>
            </div>

            {/* Spend Limits */}
            <div className="p-5 border border-[var(--border-subtle)] bg-[var(--bg-surface-hover)] rounded-xl">
               <h3 className="font-bold text-[var(--text-primary)] mb-1">Plafond de Dépenses (Daily Spend Limit)</h3>
               <p className="text-xs text-[var(--text-secondary)] mb-4">
                  Définit le montant maximum quotidien autorisé pour éviter les abus ou erreurs de campagne.
               </p>
               <div className="flex items-center gap-4">
                  <input 
                     type="range" 
                     min="10" max="2000" step="10"
                     value={spendLimit}
                     onChange={(e) => setSpendLimit(parseInt(e.target.value))}
                     className="flex-1 accent-cyan-500"
                  />
                  <div className="font-mono font-bold text-lg text-cyan-500 w-24 text-right">
                     ${spendLimit}
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* Fonctionnalités avancées : Number Pool */}
      <div className="glass-panel p-8 rounded-2xl">
         <div className="flex justify-between items-center mb-6">
            <div>
               <h2 className="text-xl font-bold flex items-center gap-2 text-[var(--text-primary)]">
                  <Hash className="text-violet-500" />
                  Number Pool (Rotation de Numéros)
               </h2>
               <p className="text-sm text-[var(--text-secondary)] mt-1">Distribuez les campagnes sur plusieurs numéros pour éviter le filtrage opérateur (Geo-Match & Sticky Sender).</p>
            </div>
            <button className="btn-primary-gradient px-4 py-2 text-sm">Gérer les Pools</button>
         </div>
         
         <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
               <thead>
                  <tr className="border-b border-[var(--border-subtle)] text-[var(--text-secondary)]">
                     <th className="pb-3 font-semibold">Nom du Pool</th>
                     <th className="pb-3 font-semibold">Numéros Associés</th>
                     <th className="pb-3 font-semibold">Algorithme</th>
                     <th className="pb-3 font-semibold">Statut</th>
                  </tr>
               </thead>
               <tbody>
                  <tr className="border-b border-[var(--border-subtle)]">
                     <td className="py-4 font-bold text-[var(--text-primary)]">Campagne USA Est</td>
                     <td className="py-4 text-[var(--text-secondary)] font-mono">15 numéros (+1 212...)</td>
                     <td className="py-4 text-[var(--text-primary)]">Geo-Match prioritaire</td>
                     <td className="py-4"><span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 text-xs font-bold rounded-md">Actif</span></td>
                  </tr>
                  <tr>
                     <td className="py-4 font-bold text-[var(--text-primary)]">Marketing France</td>
                     <td className="py-4 text-[var(--text-secondary)] font-mono">3 numéros (+33 6...)</td>
                     <td className="py-4 text-[var(--text-primary)]">Round Robin (Rotation)</td>
                     <td className="py-4"><span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 text-xs font-bold rounded-md">Actif</span></td>
                  </tr>
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}
