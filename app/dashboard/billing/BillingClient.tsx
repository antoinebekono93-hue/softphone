"use client";

import { useState, useTransition } from "react";
import { createStripeTopupSession, createFlutterwaveTopupLink } from "./actions";

export default function BillingClient({ 
  initialBalance, 
  planName,
  planPrice
}: { 
  initialBalance: number; 
  planName: string;
  planPrice: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [customAmount, setCustomAmount] = useState<string>("20");

  const handleTopup = (processor: 'stripe' | 'flutterwave', amount: number) => {
    startTransition(async () => {
      try {
        if (processor === 'stripe') {
          const { url } = await createStripeTopupSession(amount);
          window.location.href = url;
        } else {
          const { url } = await createFlutterwaveTopupLink(amount);
          window.location.href = url;
        }
      } catch (error: any) {
        console.error(error);
        alert("Error starting checkout: " + error.message);
      }
    });
  };

  const predefinedAmounts = [20, 50, 100];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Wallet Balance Card */}
      <div className="glass rounded-2xl p-6 border border-[var(--border-subtle)] space-y-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan-400"><path d="M20 12V8H6a2 2 0 01-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12c0 1.1.9 2 2 2h14v-4H6a2 2 0 01-2-2V6"/><path d="M20 12v4h-2a2 2 0 01-2-2v-2h4z"/></svg>
          Wallet Balance
        </h2>
        <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
          ${initialBalance.toFixed(2)}
        </div>
        <p className="text-sm text-[var(--text-secondary)]">
          Used for out-of-plan minutes, SMS, and AI features.
        </p>

        <div className="space-y-4 pt-4 border-t border-[var(--border-subtle)]">
          <h3 className="text-sm font-semibold text-white">Top Up Balance</h3>
          
          <div className="flex flex-wrap gap-2">
            {predefinedAmounts.map(amount => (
              <button
                key={amount}
                onClick={() => setCustomAmount(amount.toString())}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${parseInt(customAmount) === amount ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:text-white'}`}
              >
                +${amount}
              </button>
            ))}
            <div className="relative flex-1 min-w-[100px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">$</span>
              <input 
                type="number" 
                min="5"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg py-2 pl-7 pr-3 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button 
              onClick={() => handleTopup('stripe', parseInt(customAmount))}
              disabled={isPending || !parseInt(customAmount) || parseInt(customAmount) < 5}
              className="flex items-center justify-center gap-2 py-3 rounded-xl font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition-all disabled:opacity-50"
            >
              Pay via Stripe
            </button>
            <button 
              onClick={() => handleTopup('flutterwave', parseInt(customAmount))}
              disabled={isPending || !parseInt(customAmount) || parseInt(customAmount) < 5}
              className="flex items-center justify-center gap-2 py-3 rounded-xl font-medium bg-orange-600 hover:bg-orange-700 text-white transition-all disabled:opacity-50"
            >
              Pay via Flutterwave
            </button>
          </div>
        </div>
      </div>

      {/* Current Plan Card */}
      <div className="glass rounded-2xl p-6 border border-[var(--border-subtle)] flex flex-col">
        <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-violet-400"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          Current Plan
        </h2>
        
        <div className="flex-1 flex flex-col justify-center items-center text-center space-y-4">
          <div className="text-2xl font-bold text-white">{planName}</div>
          <div className="text-4xl font-black text-[var(--text-secondary)]">
            ${planPrice}<span className="text-lg text-[var(--text-tertiary)]">/mo</span>
          </div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Active
          </span>
        </div>
      </div>
    </div>
  );
}
