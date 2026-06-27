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
      <header className="fixed top-0 inset-x-0 h-16 flex items-center justify-between px-6 mx-auto w-full z-50 bg-[var(--bg-surface-solid)]/40 backdrop-blur-xl border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-2 flex-1">
            <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-cyan-500 to-violet-500 shadow-[0_0_15px_rgba(0,212,255,0.3)]"></div>
            <span className="text-lg font-bold tracking-tight text-[var(--text-primary)]">Antigravity</span>
          </div>
          <nav className="hidden md:flex gap-8 text-sm font-bold text-[var(--text-secondary)]">
            <Link href="#features" className="hover:text-[var(--text-primary)] transition-colors">Features</Link>
            <Link href="#integrations" className="hover:text-[var(--text-primary)] transition-colors">Integrations</Link>
            <Link href="#pricing" className="hover:text-[var(--text-primary)] transition-colors">Pricing</Link>
          </nav>
          <div className="flex gap-4 items-center flex-1 justify-end">
            <ThemeToggle />
            <Link href="/login" className="text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors hidden sm:block">
              Log in
            </Link>
            <Link href="/register" className="text-sm font-bold btn-primary-gradient px-4 py-2 rounded-full hover:scale-105 transition-transform">
              Start Free Trial
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <main className="flex-1 flex flex-col items-center text-center px-4 pt-32 pb-20 relative">
        {/* Glow de fond */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-violet-500/20 blur-[120px] rounded-full pointer-events-none -z-10"></div>
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-cyan-500/20 blur-[100px] rounded-full pointer-events-none -z-10"></div>

        {/* Badge */}
        <div className="opacity-0 animate-fade-up inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface-hover)] text-xs font-bold text-cyan-500 mb-8 backdrop-blur-md shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          ✨ Introducing AI Call Summaries
        </div>
        
        {/* H1 */}
        <h1 className="opacity-0 animate-fade-up [animation-delay:100ms] text-6xl md:text-8xl font-extrabold tracking-tighter mb-6 max-w-5xl leading-[1.1] text-[var(--text-primary)]">
          The phone system <br className="hidden md:block"/>
          for <span className="text-gradient">modern teams.</span>
        </h1>
        
        {/* Subtitle */}
        <p className="opacity-0 animate-fade-up [animation-delay:200ms] text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mb-10 font-medium">
          A beautiful, reliable cloud phone built for the Apple ecosystem. Deploy in seconds. 
          No hardware, no carrier limits.
        </p>
        
        {/* CTAs */}
        <div className="opacity-0 animate-fade-up [animation-delay:300ms] flex flex-col sm:flex-row gap-4 items-center mb-20">
          <Link href="/register" className="text-base font-bold btn-primary-gradient px-8 py-4 rounded-full shadow-[0_0_40px_rgba(34,211,238,0.4)] hover:scale-105 transition-all">
            Start for free
          </Link>
          <Link href="/dashboard/softphone" className="text-base font-bold bg-[var(--bg-surface-solid)] text-[var(--text-primary)] border border-[var(--border-subtle)] px-8 py-4 rounded-full hover:bg-[var(--bg-surface-hover)] transition-all flex items-center gap-2 shadow-sm">
            View Live Demo
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </Link>
        </div>

        {/* Hero Visual Mockup */}
        <div className="opacity-0 animate-fade-up [animation-delay:400ms] w-full max-w-5xl relative">
          <div className="aspect-[21/9] md:aspect-[16/9] rounded-[40px] border border-[var(--border-subtle)] glass-panel bg-[var(--bg-surface-solid)]/50 overflow-hidden flex items-end justify-center relative shadow-[0_30px_100px_rgba(0,0,0,0.4)]">
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-base)] via-transparent to-transparent z-10 pointer-events-none"></div>
            
            {/* Fake Softphone UI */}
            <div className="w-80 h-[80%] rounded-t-[2rem] border-t border-x border-[var(--border-subtle)] glass-panel shadow-2xl relative z-0 flex flex-col p-6 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1/2 bg-cyan-500/10 blur-[50px]"></div>
              <div className="w-full flex justify-between items-center mb-8">
                <div className="text-[var(--text-secondary)] text-xs font-bold uppercase tracking-widest">Active Call</div>
                <div className="text-emerald-500 text-xs font-mono font-bold">04:12</div>
              </div>
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-cyan-500 to-violet-500 mx-auto flex items-center justify-center text-3xl font-bold shadow-[0_0_30px_rgba(0,212,255,0.3)] mb-4 text-white">
                JD
              </div>
              <div className="text-2xl text-center font-bold text-[var(--text-primary)] mb-1">John Doe</div>
              <div className="text-[var(--text-secondary)] text-center text-sm font-medium mb-12">Acme Corporation</div>

              <div className="flex justify-center gap-6 mt-auto">
                <div className="w-14 h-14 rounded-full bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] flex items-center justify-center shadow-sm">
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-primary)]"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                </div>
                <div className="w-14 h-14 rounded-full bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.4)] flex items-center justify-center text-white">
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"></path><line x1="23" x2="1" y1="1" y2="23"></line></svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 3. Social Proof (Trust Bar) */}
      <section className="py-12 border-y border-[var(--border-subtle)] bg-[var(--bg-surface-solid)]/20 overflow-hidden">
        <p className="text-center text-xs font-bold tracking-[0.2em] text-[var(--text-secondary)] uppercase mb-8">
          Powering next-generation teams at
        </p>
        <div className="relative w-full flex overflow-hidden">
          <div className="absolute left-0 w-32 h-full bg-gradient-to-r from-[var(--bg-base)] to-transparent z-10"></div>
          <div className="absolute right-0 w-32 h-full bg-gradient-to-l from-[var(--bg-base)] to-transparent z-10"></div>
          
          <div className="flex w-[200%] animate-marquee opacity-50 hover:opacity-100 transition-opacity duration-500">
            {/* Logos répétées pour l'effet infini */}
            {[1,2,3,4,5,6,7,8,1,2,3,4,5,6,7,8].map((item, i) => (
              <div key={i} className="flex-1 flex justify-center text-xl font-bold font-serif italic mx-8 text-[var(--text-primary)]">
                {["Acme", "Globex", "Initech", "Soylent", "Umbrella", "Massive", "Stark", "Wayne"][i % 8]}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Features (Bento Box) */}
      <section id="features" className="py-32 px-4 max-w-7xl mx-auto w-full">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-[var(--text-primary)]">Everything you need. <br className="hidden md:block"/><span className="text-gradient">Nothing you don't.</span></h2>
          <p className="text-[var(--text-secondary)] text-lg font-medium">A carefully crafted suite of tools designed to make you faster.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
          {/* Card 1: Large (AI Transcription) */}
          <div className="md:col-span-2 rounded-[32px] glass-panel p-8 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <h3 className="text-2xl font-bold mb-2 text-[var(--text-primary)]">Live AI Transcriptions</h3>
            <p className="text-[var(--text-secondary)] font-medium">Read the conversation before you pick up the phone.</p>
            
            <div className="absolute bottom-[-20px] right-8 w-80 h-48 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-solid)]/80 backdrop-blur-xl p-4 transform group-hover:-translate-y-4 transition-transform duration-500 shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
              <div className="flex gap-3 mb-3">
                <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-500 text-[10px] font-bold border border-cyan-500/30">AI</div>
                <div className="text-xs text-[var(--text-primary)] leading-relaxed font-medium">"Hello, I'm calling about the enterprise plan on your website..."</div>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-500 text-[10px] font-bold border border-violet-500/30">JD</div>
                <div className="text-xs text-[var(--text-primary)] leading-relaxed font-medium">"Sure, I can help you with that. How many users do you have?"</div>
              </div>
            </div>
          </div>

          {/* Card 2: Medium (Global Numbers) */}
          <div className="rounded-[32px] glass-panel p-8 relative overflow-hidden group">
            <h3 className="text-2xl font-bold mb-2 text-[var(--text-primary)]">Global Presence</h3>
            <p className="text-[var(--text-secondary)] mb-8 font-medium">Local numbers in 150+ countries.</p>
            <div className="w-full aspect-square rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface-hover)] flex items-center justify-center relative shadow-inner">
               <div className="absolute w-full h-full border border-cyan-500 rounded-full animate-ping opacity-20"></div>
               <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-500"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
            </div>
          </div>

          {/* Card 3: Medium (Shared Inbox) */}
          <div className="rounded-[32px] glass-panel p-8 relative overflow-hidden group">
             <h3 className="text-2xl font-bold mb-2 text-[var(--text-primary)]">Shared Inbox</h3>
             <p className="text-[var(--text-secondary)] font-medium">Collaborate on SMS & Voicemails.</p>
             <div className="absolute bottom-8 left-8 flex -space-x-4">
                <div className="w-12 h-12 rounded-full border-2 border-[var(--bg-surface-solid)] bg-gradient-to-tr from-cyan-400 to-blue-500 shadow-md"></div>
                <div className="w-12 h-12 rounded-full border-2 border-[var(--bg-surface-solid)] bg-gradient-to-tr from-violet-400 to-fuchsia-500 shadow-md"></div>
                <div className="w-12 h-12 rounded-full border-2 border-[var(--bg-surface-solid)] bg-[var(--bg-surface-hover)] backdrop-blur-md flex items-center justify-center text-xs font-bold text-[var(--text-primary)] shadow-md">+3</div>
             </div>
          </div>

          {/* Card 4: Large (Integrations / CRM) */}
          <div className="md:col-span-2 rounded-[32px] glass-panel p-8 relative overflow-hidden group">
            <h3 className="text-2xl font-bold mb-2 text-[var(--text-primary)]">CRM Synchronization</h3>
            <p className="text-[var(--text-secondary)] font-medium">Logs calls directly into HubSpot and Salesforce.</p>
            <div className="absolute right-0 bottom-0 w-2/3 h-2/3 bg-gradient-to-tl from-emerald-500/10 to-transparent"></div>
          </div>
        </div>
      </section>

      {/* 5. Integrations */}
      <section id="integrations" className="py-32 border-t border-[var(--border-subtle)] bg-[var(--bg-surface-solid)]/30">
        <div className="max-w-4xl mx-auto px-4 text-center">
           <h2 className="text-3xl md:text-4xl font-extrabold mb-16 text-[var(--text-primary)]">Works with your <span className="text-gradient">existing stack.</span></h2>
           <div className="flex flex-wrap justify-center items-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-700">
             <div className="text-2xl font-bold text-[var(--text-primary)]">HubSpot</div>
             <div className="text-2xl font-bold text-[var(--text-primary)]">Salesforce</div>
             <div className="text-2xl font-bold text-[var(--text-primary)]">Zendesk</div>
             <div className="text-2xl font-bold text-[var(--text-primary)]">Slack</div>
             <div className="text-2xl font-bold text-[var(--text-primary)]">Intercom</div>
           </div>
        </div>
      </section>

      {/* 6. Pricing Teaser & Bottom CTA */}
      <section id="pricing" className="py-32 px-4 max-w-7xl mx-auto w-full text-center">
        <h2 className="text-5xl md:text-7xl font-extrabold tracking-tighter mb-8 text-[var(--text-primary)]">Ready to upgrade <br/> <span className="text-gradient">your team's voice?</span></h2>
        <p className="text-xl text-[var(--text-secondary)] mb-12 font-medium">Simple pricing. No hidden carrier fees.</p>
        <Link href="/register" className="inline-block text-lg font-bold btn-primary-gradient px-10 py-5 rounded-full shadow-[0_0_40px_rgba(34,211,238,0.4)] hover:scale-105 transition-all">
          Start your 14-day free trial
        </Link>
      </section>

      {/* 7. Footer */}
      <footer className="border-t border-[var(--border-subtle)] pt-16 pb-8 px-6 max-w-7xl mx-auto w-full bg-[var(--bg-base)]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-5 h-5 rounded bg-gradient-to-tr from-cyan-500 to-violet-500"></div>
              <span className="font-bold text-[var(--text-primary)]">Antigravity</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-secondary)]">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
              All systems operational
            </div>
          </div>
          <div className="flex flex-col gap-3 text-sm font-medium text-[var(--text-secondary)]">
            <h4 className="font-bold text-[var(--text-primary)] mb-2">Product</h4>
            <Link href="#" className="hover:text-[var(--text-primary)] transition-colors">Features</Link>
            <Link href="#" className="hover:text-[var(--text-primary)] transition-colors">Integrations</Link>
            <Link href="#" className="hover:text-[var(--text-primary)] transition-colors">Pricing</Link>
            <Link href="#" className="hover:text-[var(--text-primary)] transition-colors">Changelog</Link>
          </div>
          <div className="flex flex-col gap-3 text-sm font-medium text-[var(--text-secondary)]">
            <h4 className="font-bold text-[var(--text-primary)] mb-2">Resources</h4>
            <Link href="#" className="hover:text-[var(--text-primary)] transition-colors">Documentation</Link>
            <Link href="#" className="hover:text-[var(--text-primary)] transition-colors">Help Center</Link>
            <Link href="#" className="hover:text-[var(--text-primary)] transition-colors">Blog</Link>
          </div>
          <div className="flex flex-col gap-3 text-sm font-medium text-[var(--text-secondary)]">
            <h4 className="font-bold text-[var(--text-primary)] mb-2">Company</h4>
            <Link href="#" className="hover:text-[var(--text-primary)] transition-colors">About</Link>
            <Link href="#" className="hover:text-[var(--text-primary)] transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-[var(--text-primary)] transition-colors">Terms</Link>
          </div>
        </div>
        <div className="text-center text-xs font-bold text-[var(--text-secondary)] pt-8 border-t border-[var(--border-subtle)]">
          © {new Date().getFullYear()} Antigravity Inc. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
