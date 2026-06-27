"use client";

import { useState } from "react";
import { PhoneCall, Activity, PhoneMissed, Users, Settings, Radio, Bot, Mic } from "lucide-react";

export default function GodModeVoicePage() {
  const [webhookUrl, setWebhookUrl] = useState("https://api.antigravity.io/v1/telnyx/webhook");
  const [opusEnabled, setOpusEnabled] = useState(true);

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2 text-[var(--text-primary)] flex items-center gap-3">
           <PhoneCall className="text-cyan-500" />
           Gestion Vocale (Appels & IA)
        </h1>
        <p className="text-[var(--text-secondary)]">Contrôlez l'infrastructure vocale, le routage Telnyx et les agents IA.</p>
      </div>

      {/* KPIs Prioritaires */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="glass-panel p-6 rounded-2xl flex flex-col relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10">
             <PhoneCall className="w-10 h-10" />
           </div>
           <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">Appels Total</span>
           <span className="text-3xl font-bold text-[var(--text-primary)]">48,210</span>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex flex-col relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10">
             <Activity className="w-10 h-10" />
           </div>
           <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">Taux de Connexion</span>
           <span className="text-3xl font-bold text-emerald-500">89.2%</span>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex flex-col relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10">
             <PhoneMissed className="w-10 h-10" />
           </div>
           <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">Appels Abandonnés</span>
           <span className="text-3xl font-bold text-rose-500">3.4%</span>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex flex-col relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10">
             <Users className="w-10 h-10" />
           </div>
           <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">Pic Simultané</span>
           <span className="text-3xl font-bold text-cyan-500">142</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
         {/* Configuration de l'Application Vocale */}
         <div className="glass-panel p-8 rounded-2xl flex flex-col">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-[var(--text-primary)]">
               <Settings className="text-violet-500" />
               Configuration d'Application (Voice API)
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mb-6">
               Paramètres de connexion avec l'API Telnyx Call Control.
            </p>

            {/* Webhook Setup */}
            <div className="mb-6">
               <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">Webhook URL (Événements)</label>
               <input 
                  type="text"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-lg px-4 py-3 text-[var(--text-primary)] font-mono text-sm focus:border-cyan-500 outline-none transition-colors"
               />
               <p className="text-xs text-[var(--text-secondary)] mt-2">URL appelée par Telnyx pour gérer les événements en temps réel (Answer, Hangup, DTMF).</p>
            </div>

            {/* Latence & Codecs */}
            <div className="space-y-4 flex-1">
               <h3 className="font-bold text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-2">Latence & Codecs</h3>
               
               <div className="p-4 border border-[var(--border-subtle)] bg-[var(--bg-surface-hover)] rounded-xl flex justify-between items-center">
                  <div>
                     <div className="font-bold text-[var(--text-primary)] flex items-center gap-2">
                        <Radio className="w-4 h-4 text-emerald-500" /> 
                        Routage d'Ancrage (Media Anchor)
                     </div>
                     <p className="text-xs text-[var(--text-secondary)] mt-1">Sélection automatique du site le plus proche.</p>
                  </div>
                  <select className="bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm rounded-lg px-3 py-1">
                     <option>Auto (Recommandé)</option>
                     <option>US-East (Ashburn)</option>
                     <option>EU-West (Frankfurt)</option>
                  </select>
               </div>

               <div className="p-4 border border-[var(--border-subtle)] bg-[var(--bg-surface-hover)] rounded-xl flex justify-between items-center">
                  <div>
                     <div className="font-bold text-[var(--text-primary)]">Codec Opus (HD Audio)</div>
                     <p className="text-xs text-[var(--text-secondary)] mt-1">Audio haute fidélité pour le WebRTC.</p>
                  </div>
                  <button 
                     onClick={() => setOpusEnabled(!opusEnabled)}
                     className={`w-12 h-6 rounded-full transition-colors relative ${opusEnabled ? 'bg-cyan-500' : 'bg-gray-600'}`}
                  >
                     <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${opusEnabled ? 'translate-x-6' : ''}`}></div>
                  </button>
               </div>
            </div>

            <button className="mt-6 w-full btn-primary-gradient py-3 text-sm font-bold">
               Sauvegarder la Configuration
            </button>
         </div>

         {/* Automatisation IA & SVI */}
         <div className="glass-panel p-8 rounded-2xl flex flex-col">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-[var(--text-primary)]">
               <Bot className="text-emerald-500" />
               Automatisation IA & SVI
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mb-6">
               Configurez les menus interactifs et les agents vocaux synthétiques pour automatiser l'accueil.
            </p>

            <div className="space-y-4 flex-1">
               {/* SVI Logiciel */}
               <div className="p-5 border border-[var(--border-subtle)] bg-[var(--bg-surface-hover)] rounded-xl relative overflow-hidden group cursor-pointer">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <h3 className="font-bold text-[var(--text-primary)] mb-1">Éditeur SVI (Serveur Vocal Interactif)</h3>
                  <p className="text-xs text-[var(--text-secondary)]">Définissez les menus (Tapez 1 pour le support, Tapez 2 pour les ventes).</p>
               </div>

               {/* Agent IA */}
               <div className="p-5 border border-[var(--border-subtle)] bg-[var(--bg-surface-hover)] rounded-xl relative overflow-hidden group cursor-pointer">
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="flex justify-between items-start">
                     <div>
                        <h3 className="font-bold text-[var(--text-primary)] mb-1">Agents Vocaux (IA)</h3>
                        <p className="text-xs text-[var(--text-secondary)]">Connectez OpenAI ou Claude pour une conversation naturelle.</p>
                     </div>
                     <span className="px-2 py-1 bg-violet-500/20 text-violet-400 text-[10px] font-bold rounded uppercase tracking-wider">BETA</span>
                  </div>
               </div>

               {/* TTS Config */}
               <div className="p-5 border border-[var(--border-subtle)] bg-[var(--bg-surface-hover)] rounded-xl relative overflow-hidden group">
                  <div className="flex items-center gap-3 mb-3">
                     <div className="p-2 bg-rose-500/10 rounded-lg text-rose-500 shrink-0"><Mic className="w-4 h-4" /></div>
                     <h3 className="font-bold text-[var(--text-primary)]">Synthèse Vocale (TTS)</h3>
                  </div>
                  <div className="flex gap-4">
                     <select className="flex-1 bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm rounded-lg px-3 py-2">
                        <option>ElevenLabs (Premium)</option>
                        <option>Amazon Polly</option>
                        <option>Google Cloud TTS</option>
                     </select>
                     <select className="flex-1 bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm rounded-lg px-3 py-2">
                        <option>Voix : Alice (FR)</option>
                        <option>Voix : Thomas (FR)</option>
                     </select>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
