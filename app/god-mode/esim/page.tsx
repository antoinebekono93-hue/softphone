"use client";

import { useState } from "react";
import { Wifi, Activity, QrCode, Download, Database, AlertTriangle, ShieldCheck, Search, Plus } from "lucide-react";

export default function GodModeEsimPage() {
  const [dataLimit, setDataLimit] = useState(10);

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-[var(--text-primary)] flex items-center gap-3">
             <Wifi className="text-cyan-500" />
             Gestion des eSIM (Wireless & IoT)
          </h1>
          <p className="text-[var(--text-secondary)]">Déploiement et contrôle de la connectivité globale pour flottes IoT et mobiles.</p>
        </div>
        <button className="btn-primary-gradient px-4 py-2 text-sm shadow-md">
           <Plus className="w-4 h-4" /> Nouvelle flotte eSIM
        </button>
      </div>

      {/* Configuration d'Application Vocale (Adapted for eSIM) - Data Plans & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
         {/* Gestion des Profils & QR Codes */}
         <div className="glass-panel p-8 rounded-2xl flex flex-col">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-[var(--text-primary)]">
               <QrCode className="text-violet-500" />
               Déploiement de Profils (OTA)
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mb-6">
               Générez et activez des profils eSIM virtuels instantanément.
            </p>

            <div className="space-y-4 flex-1">
               {/* Download vs Activate */}
               <div className="p-5 border border-[var(--border-subtle)] bg-[var(--bg-surface-hover)] rounded-xl relative overflow-hidden">
                  <div className="flex justify-between items-center mb-2">
                     <div className="flex items-center gap-2">
                        <Download className="w-4 h-4 text-cyan-500" />
                        <h3 className="font-bold text-[var(--text-primary)]">Téléchargement passif</h3>
                     </div>
                     <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-500 text-[10px] font-bold uppercase rounded">Recommandé pour IoT</span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">
                     Le profil est téléchargé sur le composant (eUICC) mais ne consomme pas de forfait tant qu'il n'est pas réveillé par API.
                  </p>
               </div>

               <div className="p-5 border border-[var(--border-subtle)] bg-[var(--bg-surface-hover)] rounded-xl relative overflow-hidden">
                  <div className="flex justify-between items-center mb-2">
                     <div className="flex items-center gap-2">
                        <QrCode className="w-4 h-4 text-emerald-500" />
                        <h3 className="font-bold text-[var(--text-primary)]">Activation immédiate (QR Code)</h3>
                     </div>
                     <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase rounded">Smartphones</span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mb-3">
                     Idéal pour les employés. Le forfait est activé dès le premier scan.
                  </p>
                  <button className="w-full border border-[var(--border-subtle)] bg-[var(--bg-surface-solid)] py-2 rounded-lg text-sm font-semibold hover:bg-[var(--bg-surface-hover)] transition-colors">
                     Générer QR Code de test
                  </button>
               </div>
            </div>
         </div>

         {/* Contrôle de consommation & Forfaits */}
         <div className="glass-panel p-8 rounded-2xl flex flex-col">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-[var(--text-primary)]">
               <Database className="text-emerald-500" />
               Forfaits & Limites de Consommation
            </h2>

            <div className="space-y-6 flex-1">
               <div>
                  <h3 className="font-bold text-[var(--text-primary)] mb-2 text-sm">Type de Forfait</h3>
                  <select className="w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-lg px-4 py-3 text-[var(--text-primary)] text-sm focus:border-emerald-500 outline-none transition-colors">
                     <option>Pay-as-you-go (Facturation au MB)</option>
                     <option>Forfait Fixe 1GB Global</option>
                     <option>Forfait IoT Bas Débit (50MB/mois)</option>
                  </select>
               </div>

               <div className="p-5 border border-rose-500/20 bg-rose-500/5 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                     <AlertTriangle className="w-4 h-4 text-rose-500" />
                     <h3 className="font-bold text-[var(--text-primary)] text-sm">Alerte & Blocage Automatique (Data Limit)</h3>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mb-4">
                     Définit la limite maximale par eSIM. Au-delà, l'eSIM est suspendue temporairement.
                  </p>
                  <div className="flex items-center gap-4">
                     <input 
                        type="range" 
                        min="1" max="100" step="1"
                        value={dataLimit}
                        onChange={(e) => setDataLimit(parseInt(e.target.value))}
                        className="flex-1 accent-rose-500"
                     />
                     <div className="font-mono font-bold text-lg text-rose-500 w-20 text-right">
                        {dataLimit} GB
                     </div>
                  </div>
               </div>

               <div>
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">Webhook d'Alerte</label>
                  <input 
                     type="text"
                     defaultValue="https://api.antigravity.io/v1/esim/alerts"
                     className="w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-lg px-4 py-2 text-[var(--text-secondary)] font-mono text-xs focus:border-emerald-500 outline-none"
                  />
               </div>
            </div>
         </div>
      </div>

      {/* Vue d'ensemble de la flotte (Table) */}
      <div className="glass-panel p-8 rounded-2xl">
         <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <div>
               <h2 className="text-xl font-bold flex items-center gap-2 text-[var(--text-primary)]">
                  <Activity className="text-cyan-500" />
                  Flotte Active (Inventaire eSIM)
               </h2>
               <p className="text-sm text-[var(--text-secondary)] mt-1">Vue globale des cartes SIM physiques et eSIM virtuelles déployées.</p>
            </div>
            <div className="relative w-full sm:w-64">
               <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
               <input 
                  type="text"
                  placeholder="Rechercher par EID ou statut..."
                  className="w-full pl-9 pr-4 py-2 bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-lg text-sm text-[var(--text-primary)] focus:border-cyan-500 outline-none"
               />
            </div>
         </div>
         
         <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
               <thead>
                  <tr className="border-b border-[var(--border-subtle)] text-[var(--text-secondary)]">
                     <th className="pb-3 font-semibold">EID (Identifiant Unique)</th>
                     <th className="pb-3 font-semibold">Forfait Assigné</th>
                     <th className="pb-3 font-semibold">Consommation (Mois)</th>
                     <th className="pb-3 font-semibold">Réseau / État</th>
                     <th className="pb-3 font-semibold">Statut</th>
                  </tr>
               </thead>
               <tbody>
                  <tr className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)] transition-colors">
                     <td className="py-4 font-mono text-xs text-[var(--text-primary)]">
                        89049032005008882600000000001234
                     </td>
                     <td className="py-4 text-[var(--text-secondary)]">Pay-as-you-go</td>
                     <td className="py-4 font-mono text-cyan-500 font-medium">
                        2.4 GB <span className="text-[var(--text-secondary)] text-xs">/ ∞</span>
                     </td>
                     <td className="py-4 text-[var(--text-secondary)]">
                        <div className="flex items-center gap-2">
                           <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                           Connecté (Orange FR)
                        </div>
                     </td>
                     <td className="py-4"><span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase rounded-md">Actif</span></td>
                  </tr>
                  <tr className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)] transition-colors">
                     <td className="py-4 font-mono text-xs text-[var(--text-primary)]">
                        89049032005008882600000000005678
                     </td>
                     <td className="py-4 text-[var(--text-secondary)]">Forfait IoT 50MB</td>
                     <td className="py-4 font-mono text-cyan-500 font-medium">
                        48 MB <span className="text-rose-500 text-xs">/ 50 MB (Alerte)</span>
                     </td>
                     <td className="py-4 text-[var(--text-secondary)]">
                        <div className="flex items-center gap-2">
                           <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                           Hors ligne (Depuis 2j)
                        </div>
                     </td>
                     <td className="py-4"><span className="px-2 py-1 bg-cyan-500/10 text-cyan-500 text-[10px] font-bold uppercase rounded-md">Téléchargé</span></td>
                  </tr>
                  <tr className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                     <td className="py-4 font-mono text-xs text-[var(--text-primary)]">
                        89049032005008882600000000009012
                     </td>
                     <td className="py-4 text-[var(--text-secondary)]">Forfait Fixe 1GB</td>
                     <td className="py-4 font-mono text-[var(--text-secondary)]">
                        0 MB <span className="text-xs">/ 1 GB</span>
                     </td>
                     <td className="py-4 text-[var(--text-secondary)]">
                        <div className="flex items-center gap-2">
                           <span className="w-2 h-2 rounded-full bg-gray-600"></span>
                           Jamais connecté
                        </div>
                     </td>
                     <td className="py-4"><span className="px-2 py-1 bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] text-[var(--text-secondary)] text-[10px] font-bold uppercase rounded-md">Inactif</span></td>
                  </tr>
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}
