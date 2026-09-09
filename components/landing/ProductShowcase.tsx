export default function ProductShowcase() {
  return (
    <section id="features" className="py-24 px-4 max-w-7xl mx-auto w-full">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-[var(--text-primary)]">
          La puissance de l'IA. <br className="hidden md:block"/>
          <span className="text-gradient">La simplicité d'une app.</span>
        </h2>
        <p className="text-[var(--text-secondary)] text-lg font-medium">
          Une suite d'outils conçue pour vous faire gagner un temps précieux.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
        {/* Card 1: Large (AI Transcription) */}
        <div className="md:col-span-2 rounded-[32px] glass-panel-premium p-8 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <h3 className="text-2xl font-bold mb-2 text-[var(--text-primary)]">Transcriptions IA en direct</h3>
          <p className="text-[var(--text-secondary)] font-medium">Lisez la conversation avant même de décrocher ou générez des résumés d'appels automatiquement.</p>

          <div className="absolute bottom-[-20px] right-8 w-80 h-48 rounded-xl border border-white/10 bg-slate-900/80 backdrop-blur-xl p-4 transform group-hover:-translate-y-4 transition-transform duration-500 shadow-[0_10px_30px_rgba(255,87,87,0.1)]">
            <div className="flex gap-3 mb-3">
              <div className="w-6 h-6 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-500 text-[10px] font-bold border border-rose-500/30">IA</div>
              <div className="text-xs text-[var(--text-primary)] leading-relaxed font-medium">"Bonjour, j'appelle concernant le devis pour le chantier de rénovation..."</div>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500 text-[10px] font-bold border border-orange-500/30">JD</div>
              <div className="text-xs text-[var(--text-primary)] leading-relaxed font-medium">"Bien sûr, je peux vous aider. Quel est le numéro de référence ?"</div>
            </div>
          </div>
        </div>

        {/* Card 2: Medium (Global Numbers) */}
        <div className="rounded-[32px] glass-panel-premium p-8 relative overflow-hidden group">
          <h3 className="text-2xl font-bold mb-2 text-[var(--text-primary)]">Présence Globale</h3>
          <p className="text-[var(--text-secondary)] mb-8 font-medium">Numéros locaux dans plus de 50 pays.</p>
          <div className="w-full aspect-square rounded-full border border-white/10 bg-slate-900 flex items-center justify-center relative shadow-inner">
             <div className="absolute w-full h-full border border-orange-500 rounded-full animate-ping opacity-20"></div>
             <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
          </div>
        </div>

        {/* Card 3: Medium (Shared Inbox) */}
        <div className="rounded-[32px] glass-panel-premium p-8 relative overflow-hidden group">
           <h3 className="text-2xl font-bold mb-2 text-[var(--text-primary)]">Boîte Partagée</h3>
           <p className="text-[var(--text-secondary)] font-medium">Collaborez sur les SMS et messages vocaux en équipe.</p>
           <div className="absolute bottom-8 left-8 flex -space-x-4">
              <div className="w-12 h-12 rounded-full border-2 border-slate-900 bg-gradient-to-tr from-rose-400 to-orange-500 shadow-md"></div>
              <div className="w-12 h-12 rounded-full border-2 border-slate-900 bg-gradient-to-tr from-violet-400 to-fuchsia-500 shadow-md"></div>
              <div className="w-12 h-12 rounded-full border-2 border-slate-900 bg-slate-800 backdrop-blur-md flex items-center justify-center text-xs font-bold text-[var(--text-primary)] shadow-md">+3</div>
           </div>
        </div>

        {/* Card 4: Medium (AI Call Analytics) */}
        <div className="rounded-[32px] glass-panel-premium p-8 relative overflow-hidden group">
          <h3 className="text-2xl font-bold mb-2 text-[var(--text-primary)]">Analytics IA</h3>
          <p className="text-[var(--text-secondary)] font-medium">Analysez chaque appel pour améliorer vos performances.</p>
          <div className="absolute bottom-6 right-6 flex items-end gap-2">
            <div className="w-8 h-16 rounded-md bg-rose-500/30"></div>
            <div className="w-8 h-24 rounded-md bg-rose-500/50"></div>
            <div className="w-8 h-12 rounded-md bg-orange-500/30"></div>
            <div className="w-8 h-20 rounded-md bg-orange-500/50"></div>
          </div>
        </div>

        {/* Card 5: Large (CRM Sync) */}
        <div className="md:col-span-2 rounded-[32px] glass-panel-premium p-8 relative overflow-hidden group">
          <h3 className="text-2xl font-bold mb-2 text-[var(--text-primary)]">Synchronisation CRM (Bientôt)</h3>
          <p className="text-[var(--text-secondary)] font-medium">Enregistrez vos appels directement dans HubSpot et Salesforce sans aucun effort manuel.</p>
          <div className="absolute right-0 bottom-0 w-2/3 h-2/3 bg-gradient-to-tl from-rose-500/10 to-transparent"></div>
        </div>
      </div>
    </section>
  );
}
