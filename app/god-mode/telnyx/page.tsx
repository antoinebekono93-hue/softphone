import React from "react";

const telnyxServices = [
  {
    category: "Services de Messagerie (Messaging)",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
    ),
    services: [
      { name: "SMS API", cost: "~0,004 $ / msg", markup: "30-50%", strategy: "Rappels de rendez-vous et notifications.", enabled: true },
      { name: "MMS API", cost: "~0,015 $ (envoi)", markup: "40%", strategy: "Coupons, images produits, promotions.", enabled: true },
      { name: "SMS Short Code", cost: "~1 000 $ / mois", markup: "Personnalisé", strategy: "Marketing à haut débit, identité forte.", enabled: false },
      { name: "RCS (Next-gen)", cost: "~0,20 $ / msg", markup: "25%", strategy: "Messages interactifs (boutons, branding).", enabled: false },
    ]
  },
  {
    category: "Services Vocaux et IA (Voice & AI)",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
    ),
    services: [
      { name: "Voice API", cost: "~0,002 $ / min", markup: "100%", strategy: "Suivi d'appels, Softphone WebRTC, SVI basique.", enabled: true },
      { name: "Voice AI (Agents)", cost: "~0,06 $ / min", markup: "50-80%", strategy: "Secrétaires IA dispo 24/7 pour les PME.", enabled: true },
      { name: "Transcription (STT)", cost: "Inclus avec IA", markup: "Forfait", strategy: "Voicemail to text, résumés d'appels.", enabled: true },
      { name: "Synthèse Vocale (TTS)", cost: "~0,000003 $ / car.", markup: "Forfait", strategy: "Menus vocaux personnalisés multi-langues.", enabled: true },
    ]
  },
  {
    category: "Sécurité et Vérification (Identity)",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
    ),
    services: [
      { name: "Verify API (OTP)", cost: "~0,03 $ / succès", markup: "20%", strategy: "Sécurisation des comptes, 2FA.", enabled: true },
      { name: "Number Lookup", cost: "Minime", markup: "Forfait", strategy: "Vérification de portabilité, type de numéro.", enabled: false },
    ]
  },
  {
    category: "Connectivité et IoT (Wireless)",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" x2="12.01" y1="20" y2="20"/></svg>
    ),
    services: [
      { name: "IoT SIM Physique", cost: "1 $ / carte + 2 $", markup: "200%", strategy: "Flottes de véhicules, compteurs.", enabled: false },
      { name: "eSIM IoT", cost: "0,70 $ + 2 $ / mois", markup: "200%", strategy: "Tablettes, TPE, déploiement instantané.", enabled: false },
      { name: "Data IoT (Usage)", cost: "~0,008 $ / Mo", markup: "Fact. au Mo", strategy: "Contrôle total des coûts datas.", enabled: false },
    ]
  }
];

export default function TelnyxControlPage() {
  return (
    <div className="w-full">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Telnyx Telecom Engine</h1>
          <p className="text-[var(--text-secondary)]">Manage your wholesale APIs, AI agents, and reselling margins for African SMEs.</p>
        </div>
        <div className="flex gap-4 text-sm font-medium">
          <div className="px-4 py-2 bg-[#1a1a1a] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)]/70">
             Wholesale Status: <span className="text-emerald-400">Linked</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {telnyxServices.map((section, i) => (
          <div key={i} className="glass-panel border-none rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 border-b border-[var(--border-subtle)] flex items-center gap-4 bg-[var(--bg-surface-hover)]">
              <div className="p-3 bg-[var(--bg-surface-hover)] rounded-xl border border-[var(--border-subtle)]">
                {section.icon}
              </div>
              <h2 className="text-xl font-bold">{section.category}</h2>
            </div>
            
            <div className="p-0 overflow-x-auto flex-1">
              <table className="w-full text-left text-sm">
                <thead className="bg-transparent border-b border-[var(--border-subtle)] text-[var(--text-secondary)]">
                  <tr>
                    <th className="px-6 py-3 font-medium uppercase tracking-wider text-xs">Service</th>
                    <th className="px-6 py-3 font-medium uppercase tracking-wider text-xs">Wholesale Cost</th>
                    <th className="px-6 py-3 font-medium uppercase tracking-wider text-xs">B2B Margin</th>
                    <th className="px-6 py-3 font-medium uppercase tracking-wider text-xs text-right">Available</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {section.services.map((svc, j) => (
                    <tr key={j} className="hover:bg-[var(--bg-surface-hover)] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-bold text-[var(--text-primary)]">{svc.name}</div>
                        <div className="text-[var(--text-secondary)] text-xs mt-1 truncate max-w-[200px]" title={svc.strategy}>
                           {svc.strategy}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-[var(--text-primary)]/70 text-xs">
                         {svc.cost}
                      </td>
                      <td className="px-6 py-4">
                         <span className="px-2 py-1 bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded text-xs font-bold text-emerald-400">
                           {svc.markup}
                         </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <label className="relative inline-flex items-center cursor-pointer">
                           <input type="checkbox" className="sr-only peer" defaultChecked={svc.enabled} />
                           <div className="w-9 h-5 bg-[var(--bg-surface-hover)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-500"></div>
                         </label>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-gradient-to-r from-red-600/20 to-orange-600/20 border border-red-500/30 rounded-2xl p-6 flex items-start gap-4">
         <div className="mt-1 text-red-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
         </div>
         <div>
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">Stratégie PME Africaines (No-seat Licenses)</h3>
            <p className="text-[var(--text-primary)]/70 text-sm leading-relaxed">
               Contrairement aux CRM traditionnels (Salesforce, HubSpot) qui facturent l'accès au logiciel par siège, 
               votre modèle économique repose sur la <strong>revente de l'infrastructure pure</strong>. En intégrant ces API Telnyx 
               via une infrastructure privée mondiale, vous facturez vos locataires (Tenants) exclusivement à l'usage, 
               tout en appliquant des marges de gros (Wholesale Markups).
            </p>
         </div>
      </div>
    </div>
  );
}
