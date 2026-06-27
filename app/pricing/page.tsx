import Link from "next/link";
import { STRIPE_PRICES } from "@/lib/stripe";

export const metadata = {
  title: "Pricing | Antigravity",
};

export default function PricingPage() {
  const plans = [
    {
      name: "Starter",
      description: "Perfect for solo founders and small teams.",
      price: "$29",
      features: ["1 Local Phone Number", "1,000 Included Minutes", "Up to 3 Users", "Basic Analytics"],
      recommended: false,
      priceId: "STARTER"
    },
    {
      name: "Pro",
      description: "Everything you need for a growing business.",
      price: "$79",
      features: ["5 Phone Numbers", "5,000 Included Minutes", "Up to 10 Users", "Advanced Call Routing", "Priority Support", "Call Recording"],
      recommended: true,
      priceId: "PRO"
    },
    {
      name: "Enterprise",
      description: "Custom solutions for large scale operations.",
      price: "$299",
      features: ["Unlimited Phone Numbers", "Unlimited Minutes", "Unlimited Users", "Custom SLA", "Dedicated Account Manager", "API Access"],
      recommended: false,
      priceId: "ENTERPRISE"
    }
  ];

  return (
    <div className="min-h-screen bg-[#050508] text-[var(--text-primary)]">
      {/* Header */}
      <header className="h-20 flex items-center justify-between px-8 max-w-7xl mx-auto w-full">
        <Link href="/" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-violet-500">
          Antigravity
        </Link>
        <div className="flex gap-4">
          <Link href="/login" className="px-5 py-2.5 text-sm font-medium text-gray-300 hover:text-[var(--text-primary)] transition-colors">Log in</Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-20 flex flex-col items-center">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold tracking-tight mb-6">Simple, transparent pricing</h1>
          <p className="text-xl text-[var(--text-secondary)] max-w-2xl mx-auto">
            Choose the plan that best fits your business needs. No hidden fees, cancel anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
          {plans.map((plan) => (
            <div key={plan.name} className={`glass rounded-3xl p-8 relative flex flex-col ${plan.recommended ? 'border-cyan-500/50 shadow-[0_0_50px_rgba(0,212,255,0.1)]' : 'border-[var(--border-subtle)]'}`}>
              {plan.recommended && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 bg-gradient-to-r from-cyan-500 to-violet-500 text-xs font-bold uppercase tracking-wider rounded-full text-[var(--text-primary)]">
                  Most Popular
                </div>
              )}
              
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <p className="text-[var(--text-secondary)] text-sm mb-6 h-10">{plan.description}</p>
              
              <div className="mb-8">
                <span className="text-5xl font-bold">{plan.price}</span>
                <span className="text-[var(--text-secondary)]">/mo</span>
              </div>
              
              <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-emerald-400 shrink-0 mt-0.5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    <span className="text-gray-300 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Link href="/register" className={`w-full py-4 rounded-xl text-center font-medium transition-all ${
                plan.recommended 
                  ? 'bg-gradient-to-r from-cyan-500 to-violet-500 text-[var(--text-primary)] hover:shadow-[0_0_20px_rgba(0,212,255,0.4)] hover:scale-[1.02] active:scale-95' 
                  : 'glass border border-white/20 hover:bg-[var(--bg-surface-hover)]'
              }`}>
                Get Started
              </Link>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
