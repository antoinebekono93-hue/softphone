import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-base)] text-[var(--text-primary)] selection:bg-cyan-500/30 font-sans overflow-x-hidden">
      {/* CSS personnalisé pour le marquee (défilement infini) */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up {
          animation: fadeUp 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />

      {/* 1. Header (Minimalist Navigation) */}
      <header className="fixed top-0 inset-x-0 h-16 flex items-center justify-between px-6 mx-auto w-full z-50 bg-[var(--bg-base)] border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-2 flex-1">
            <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-cyan-500 to-violet-500 shadow-[0_0_15px_rgba(0,212,255,0.3)]"></div>
            <span className="text-lg font-bold tracking-tight text-[var(--text-primary)]">Antigravity</span>
          </div>
          <nav className="hidden md:flex gap-8 text-sm font-bold text-[var(--text-secondary)]">
            <Link href="#solutions" className="hover:text-[var(--text-primary)] transition-colors">Solutions</Link>
            <Link href="#features" className="hover:text-[var(--text-primary)] transition-colors">Fonctionnalités</Link>
            <Link href="#integrations" className="hover:text-[var(--text-primary)] transition-colors">Intégrations</Link>
          </nav>
          <div className="flex gap-4 items-center flex-1 justify-end">
            <ThemeToggle />
            <Link href="/login" className="text-sm font-medium text-[var(--text-primary)] hover:text-gray-600 transition-colors hidden sm:block">
              Connexion
            </Link>
            <Link href="/register" className="text-sm font-medium bg-[var(--accent-primary)] text-[var(--accent-foreground)] px-4 py-2 rounded-full transition-transform">
              Essai Gratuit
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section (Transformation focus) */}
      <main className="flex-1 flex flex-col items-center text-center px-4 pt-32 pb-20 relative">
        {/* Glow de fond */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-violet-500/20 blur-[120px] rounded-full pointer-events-none -z-10"></div>
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-cyan-500/20 blur-[100px] rounded-full pointer-events-none -z-10"></div>

        {/* Badge */}
        <div className="opacity-0 animate-fade-up inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 bg-white text-xs text-[var(--text-primary)] mb-8 shadow-sm">
          <span className="font-bold">Nouveau :</span>
          <span>Fonctionnalité incroyable de votre SaaS</span>
        </div>
        
        {/* H1 */}
        <h1 className="opacity-0 animate-fade-up [animation-delay:100ms] text-5xl md:text-[5.5rem] font-extrabold tracking-tight mb-6 max-w-4xl leading-[1.05] text-[var(--text-primary)]">
          Le Softphone IA qui révolutionne votre <span className="text-gradient">relation client.</span>
        </h1>
        
        {/* Subtitle */}
        <p className="opacity-0 animate-fade-up [animation-delay:200ms] text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-10 font-normal leading-relaxed">
          Ceci est une application de démonstration construite avec supastarter. Elle vous fera gagner beaucoup de temps et d'efforts pour construire votre prochain SaaS.
        </p>
        
        {/* CTAs */}
        <div className="opacity-0 animate-fade-up [animation-delay:300ms] flex flex-col sm:flex-row gap-4 items-center mb-20">
          <Link href="/register" className="text-base font-semibold bg-[var(--accent-primary)] text-[var(--accent-foreground)] px-8 py-4 rounded-full shadow-sm hover:opacity-90 transition-all flex items-center gap-2">
            Commencer <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </Link>
          <Link href="/dashboard/softphone" className="text-base font-semibold text-[var(--text-primary)] bg-transparent hover:bg-gray-100 px-8 py-4 rounded-full transition-all flex items-center gap-2">
            Documentation
          </Link>
        </div>

        {/* Hero Visual Mockup */}
        <div className="opacity-0 animate-fade-up [animation-delay:400ms] w-full max-w-5xl relative mt-8">
          <div className="rounded-3xl bg-[#f3f4f6] p-4 md:p-8 overflow-hidden relative">
            <div className="rounded-xl bg-white shadow-2xl overflow-hidden border border-gray-200">
              {/* MacOS / Browser Header */}
              <div className="h-12 border-b border-gray-200 bg-white flex items-center justify-between px-4">
                <div className="flex items-center gap-2 w-1/3">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
                  <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
                  <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
                </div>
                <div className="w-1/3 flex justify-center">
                  <div className="bg-gray-100 rounded-md text-xs text-gray-500 py-1.5 px-4 font-medium flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    app-demo.supastarter.dev
                  </div>
                </div>
                <div className="w-1/3 flex justify-end gap-3 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/><line x1="16" x2="22" y1="5" y2="5"/><line x1="19" x2="19" y1="2" y2="8"/></svg>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/></svg>
                </div>
              </div>
              
              {/* Fake Dashboard Inner Content */}
              <div className="aspect-[21/9] md:aspect-[16/9] flex items-center justify-center relative bg-[#fafafa]">
                {/* Fake Softphone UI */}
                <div className="w-80 h-[80%] rounded-2xl border border-[var(--border-subtle)] bg-white shadow-lg relative z-0 flex flex-col p-6 overflow-hidden mt-8">
                  <div className="w-full flex justify-between items-center mb-8">
                    <div className="text-[var(--text-secondary)] text-xs font-bold uppercase tracking-widest">Appel en cours</div>
                    <div className="text-emerald-500 text-xs font-mono font-bold">04:12</div>
                  </div>
                  <div className="w-24 h-24 rounded-full bg-black mx-auto flex items-center justify-center text-3xl font-bold mb-4 text-white">
                    JD
                  </div>
                  <div className="text-2xl text-center font-bold text-[var(--text-primary)] mb-1">Jean Dupont</div>
                  <div className="text-[var(--text-secondary)] text-center text-sm font-medium mb-12">Entreprise BTP S.A.</div>

                  <div className="flex justify-center gap-6 mt-auto">
                    <div className="w-14 h-14 rounded-full bg-white border border-[var(--border-subtle)] flex items-center justify-center shadow-sm">
                       <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-primary)]"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                    </div>
                    <div className="w-14 h-14 rounded-full bg-rose-500 shadow-sm flex items-center justify-center text-white">
                       <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"></path><line x1="23" x2="1" y1="1" y2="23"></line></svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 3. Social Proof / Trust Bar */}
      <section className="py-12 border-y border-[var(--border-subtle)] bg-[var(--bg-surface-solid)]/20 overflow-hidden">
        <p className="text-center text-xs font-bold tracking-[0.2em] text-[var(--text-secondary)] uppercase mb-8">
          Ils font confiance à notre technologie
        </p>
        <div className="relative w-full flex overflow-hidden">
          <div className="absolute left-0 w-32 h-full bg-gradient-to-r from-[var(--bg-base)] to-transparent z-10"></div>
          <div className="absolute right-0 w-32 h-full bg-gradient-to-l from-[var(--bg-base)] to-transparent z-10"></div>
          
          <div className="flex w-[200%] animate-marquee opacity-50 hover:opacity-100 transition-opacity duration-500">
            {[1,2,3,4,5,6,7,8,1,2,3,4,5,6,7,8].map((item, i) => (
              <div key={i} className="flex-1 flex justify-center items-center text-xl font-bold font-serif italic mx-8 text-[var(--text-primary)]">
                {["Vinci", "Bouygues", "Eiffage", "Telnyx", "HubSpot", "Salesforce", "Spie", "Colas"][i % 8]}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Persona Benefits (Sales & Support) */}
      <section id="solutions" className="py-24 px-4 max-w-7xl mx-auto w-full">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4 text-[var(--text-primary)]">Une plateforme pensée pour <span className="text-gradient">chaque métier.</span></h2>
          <p className="text-[var(--text-secondary)] text-lg font-medium">Répondez aux besoins spécifiques de vos équipes commerciales et de votre service client.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Sales Persona */}
          <div className="p-8 rounded-[32px] border border-[var(--border-subtle)] bg-gradient-to-b from-[var(--bg-surface-solid)] to-transparent group hover:border-cyan-500/50 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-500 mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Pour les Équipes Commerciales</h3>
            <p className="text-[var(--text-secondary)] mb-6 font-medium">Ne perdez plus aucune trace de vos appels de prospection. Multipliez vos ventes avec un outil conçu pour la vélocité.</p>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-sm font-medium text-[var(--text-primary)]"><span className="text-cyan-500">✓</span> Enregistrement automatique dans le CRM</li>
              <li className="flex items-center gap-3 text-sm font-medium text-[var(--text-primary)]"><span className="text-cyan-500">✓</span> Statistiques d'appels en temps réel</li>
              <li className="flex items-center gap-3 text-sm font-medium text-[var(--text-primary)]"><span className="text-cyan-500">✓</span> Numéroteur WebRTC ultra-rapide</li>
            </ul>
          </div>
          
          {/* Support Persona */}
          <div className="p-8 rounded-[32px] border border-[var(--border-subtle)] bg-gradient-to-b from-[var(--bg-surface-solid)] to-transparent group hover:border-violet-500/50 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-500 mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/><path d="M14.05 2a9 9 0 0 1 8 7.94"/><path d="M14.05 6A5 5 0 0 1 18 10"/></svg>
            </div>
            <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Pour le Support Client</h3>
            <p className="text-[var(--text-secondary)] mb-6 font-medium">Gérez vos flux d'appels de manière collaborative et offrez une expérience client optimale sans faire patienter vos appelants.</p>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-sm font-medium text-[var(--text-primary)]"><span className="text-violet-500">✓</span> Boîte de réception partagée (Voicemails & SMS)</li>
              <li className="flex items-center gap-3 text-sm font-medium text-[var(--text-primary)]"><span className="text-violet-500">✓</span> Transcription IA des messages vocaux</li>
              <li className="flex items-center gap-3 text-sm font-medium text-[var(--text-primary)]"><span className="text-violet-500">✓</span> Routage intelligent des appels</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 5. Features (Bento Box) */}
      <section id="features" className="py-24 px-4 max-w-7xl mx-auto w-full">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-[var(--text-primary)]">La puissance de l'IA. <br className="hidden md:block"/><span className="text-gradient">La simplicité d'une app.</span></h2>
          <p className="text-[var(--text-secondary)] text-lg font-medium">Une suite d'outils conçue pour vous faire gagner un temps précieux.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
          {/* Card 1: Large (AI Transcription) */}
          <div className="md:col-span-2 rounded-[32px] glass-panel p-8 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <h3 className="text-2xl font-bold mb-2 text-[var(--text-primary)]">Transcriptions IA en direct</h3>
            <p className="text-[var(--text-secondary)] font-medium">Lisez la conversation avant même de décrocher ou générez des résumés d'appels automatiquement.</p>
            
            <div className="absolute bottom-[-20px] right-8 w-80 h-48 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-solid)]/80 backdrop-blur-xl p-4 transform group-hover:-translate-y-4 transition-transform duration-500 shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
              <div className="flex gap-3 mb-3">
                <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-500 text-[10px] font-bold border border-cyan-500/30">IA</div>
                <div className="text-xs text-[var(--text-primary)] leading-relaxed font-medium">"Bonjour, j'appelle concernant le devis pour le chantier de rénovation..."</div>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-500 text-[10px] font-bold border border-violet-500/30">JD</div>
                <div className="text-xs text-[var(--text-primary)] leading-relaxed font-medium">"Bien sûr, je peux vous aider. Quel est le numéro de référence ?"</div>
              </div>
            </div>
          </div>

          {/* Card 2: Medium (Global Numbers) */}
          <div className="rounded-[32px] glass-panel p-8 relative overflow-hidden group">
            <h3 className="text-2xl font-bold mb-2 text-[var(--text-primary)]">Présence Globale</h3>
            <p className="text-[var(--text-secondary)] mb-8 font-medium">Numéros locaux dans plus de 150 pays.</p>
            <div className="w-full aspect-square rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface-hover)] flex items-center justify-center relative shadow-inner">
               <div className="absolute w-full h-full border border-cyan-500 rounded-full animate-ping opacity-20"></div>
               <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-500"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
            </div>
          </div>

          {/* Card 3: Medium (Shared Inbox) */}
          <div className="rounded-[32px] glass-panel p-8 relative overflow-hidden group">
             <h3 className="text-2xl font-bold mb-2 text-[var(--text-primary)]">Boîte Partagée</h3>
             <p className="text-[var(--text-secondary)] font-medium">Collaborez sur les SMS et messages vocaux en équipe.</p>
             <div className="absolute bottom-8 left-8 flex -space-x-4">
                <div className="w-12 h-12 rounded-full border-2 border-[var(--bg-surface-solid)] bg-gradient-to-tr from-cyan-400 to-blue-500 shadow-md"></div>
                <div className="w-12 h-12 rounded-full border-2 border-[var(--bg-surface-solid)] bg-gradient-to-tr from-violet-400 to-fuchsia-500 shadow-md"></div>
                <div className="w-12 h-12 rounded-full border-2 border-[var(--bg-surface-solid)] bg-[var(--bg-surface-hover)] backdrop-blur-md flex items-center justify-center text-xs font-bold text-[var(--text-primary)] shadow-md">+3</div>
             </div>
          </div>

          {/* Card 4: Large (Integrations / CRM) */}
          <div className="md:col-span-2 rounded-[32px] glass-panel p-8 relative overflow-hidden group">
            <h3 className="text-2xl font-bold mb-2 text-[var(--text-primary)]">Synchronisation CRM (Bientôt)</h3>
            <p className="text-[var(--text-secondary)] font-medium">Enregistrez vos appels directement dans HubSpot et Salesforce sans aucun effort manuel.</p>
            <div className="absolute right-0 bottom-0 w-2/3 h-2/3 bg-gradient-to-tl from-emerald-500/10 to-transparent"></div>
          </div>
        </div>
      </section>

      {/* 6. Integrations Banner */}
      <section id="integrations" className="py-24 border-t border-[var(--border-subtle)] bg-[var(--bg-surface-solid)]/30">
        <div className="max-w-4xl mx-auto px-4 text-center">
           <h2 className="text-3xl md:text-4xl font-extrabold mb-12 text-[var(--text-primary)]">S'intègre avec votre <span className="text-gradient">écosystème actuel.</span></h2>
           <div className="flex flex-wrap justify-center items-center gap-10 opacity-50 grayscale hover:grayscale-0 transition-all duration-700">
             <div className="text-2xl font-bold text-[var(--text-primary)]">Telnyx</div>
             <div className="text-2xl font-bold text-[var(--text-primary)]">HubSpot</div>
             <div className="text-2xl font-bold text-[var(--text-primary)]">Salesforce</div>
             <div className="text-2xl font-bold text-[var(--text-primary)]">Zendesk</div>
             <div className="text-2xl font-bold text-[var(--text-primary)]">Spike</div>
           </div>
        </div>
      </section>

      {/* 7. Final CTA */}
      <section className="py-32 px-4 max-w-7xl mx-auto w-full text-center">
        <h2 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 text-[var(--text-primary)]">Prêt à moderniser <br/> <span className="text-gradient">votre téléphonie ?</span></h2>
        <p className="text-xl text-[var(--text-secondary)] mb-12 font-medium">Déployable en 2 minutes. Sans engagement.</p>
        <Link href="/register" className="inline-flex text-lg font-semibold bg-[var(--accent-primary)] text-[var(--accent-foreground)] px-10 py-5 rounded-full shadow-sm hover:opacity-90 transition-all items-center gap-2">
          Commencer l'essai gratuit de 14 jours <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </Link>
      </section>

      {/* 8. Footer */}
      <footer className="border-t border-[var(--border-subtle)] pt-16 pb-8 px-6 max-w-7xl mx-auto w-full bg-[var(--bg-base)]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-5 h-5 rounded bg-gradient-to-tr from-cyan-500 to-violet-500"></div>
              <span className="font-bold text-[var(--text-primary)]">Antigravity</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-secondary)]">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
              Tous les systèmes opérationnels
            </div>
          </div>
          <div className="flex flex-col gap-3 text-sm font-medium text-[var(--text-secondary)]">
            <h4 className="font-bold text-[var(--text-primary)] mb-2">Produit</h4>
            <Link href="#features" className="hover:text-[var(--text-primary)] transition-colors">Fonctionnalités</Link>
            <Link href="#integrations" className="hover:text-[var(--text-primary)] transition-colors">Intégrations</Link>
            <Link href="#" className="hover:text-[var(--text-primary)] transition-colors">Tarifs</Link>
          </div>
          <div className="flex flex-col gap-3 text-sm font-medium text-[var(--text-secondary)]">
            <h4 className="font-bold text-[var(--text-primary)] mb-2">Ressources</h4>
            <Link href="#" className="hover:text-[var(--text-primary)] transition-colors">Documentation API</Link>
            <Link href="#" className="hover:text-[var(--text-primary)] transition-colors">Centre d'Aide</Link>
            <Link href="#" className="hover:text-[var(--text-primary)] transition-colors">Blog</Link>
          </div>
          <div className="flex flex-col gap-3 text-sm font-medium text-[var(--text-secondary)]">
            <h4 className="font-bold text-[var(--text-primary)] mb-2">Entreprise</h4>
            <Link href="#" className="hover:text-[var(--text-primary)] transition-colors">À Propos</Link>
            <Link href="#" className="hover:text-[var(--text-primary)] transition-colors">Confidentialité</Link>
            <Link href="#" className="hover:text-[var(--text-primary)] transition-colors">CGV</Link>
          </div>
        </div>
        <div className="text-center text-xs font-bold text-[var(--text-secondary)] pt-8 border-t border-[var(--border-subtle)]">
          © {new Date().getFullYear()} Antigravity Inc. Tous droits réservés.
        </div>
      </footer>
    </div>
  );
}
