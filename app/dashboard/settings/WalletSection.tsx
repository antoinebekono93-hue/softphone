"use client";

import { useState } from "react";
import { Wallet, CreditCard, ArrowUpRight, ArrowDownRight, History, Loader2, AlertCircle, ExternalLink, Zap, Phone, MessageSquare } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export function WalletSection({
  balance,
  planName,
  planStatus,
}: {
  balance: number;
  planName?: string | null;
  planStatus?: string | null;
}) {
  const { t } = useLanguage();
  const [toppingUp, setToppingUp] = useState<"stripe" | "flutterwave" | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const topAmounts = [10, 25, 50, 100];

  const handleTopUp = async (amount: number, provider: "stripe" | "flutterwave") => {
    setToppingUp(provider);
    try {
      const endpoint =
        provider === "stripe"
          ? "/api/stripe/create-checkout-session"
          : "/api/billing/checkout/flutterwave";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Erreur de génération du lien de paiement.");
      }
    } catch (e) {
      alert("Erreur réseau. Veuillez réessayer.");
    } finally {
      setToppingUp(null);
    }
  };

  const handleCustomTopUp = (provider: "stripe" | "flutterwave") => {
    const amount = parseFloat(customAmount);
    if (isNaN(amount) || amount < 5) {
      alert("Le montant minimum est de 5€");
      return;
    }
    handleTopUp(amount, provider);
  };

  const loadHistory = async () => {
    if (showHistory) {
      setShowHistory(false);
      return;
    }
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/billing/data");
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
      }
    } catch (e) {
      console.error("Failed to load history", e);
    } finally {
      setLoadingHistory(false);
      setShowHistory(true);
    }
  };

  const planLabels: Record<string, { label: string; color: string }> = {
    FREE: { label: "Gratuit", color: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
    STARTER: { label: "Starter", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
    PRO: { label: "Pro", color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
    ENTERPRISE: { label: "Enterprise", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  };

  const currentPlan = planName ? planLabels[planName] || planLabels.FREE : planLabels.FREE;
  const isActive = planStatus === "ACTIVE" || planStatus === "TRIALING";

  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-medium flex items-center gap-2">
          <Wallet className="w-5 h-5 text-[var(--accent-primary)]" />
          Portefeuille & Abonnement
        </h2>
        <button
          onClick={loadHistory}
          className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1 transition-colors"
        >
          <History className="w-4 h-4" />
          Historique
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Balance Card */}
        <div className="bg-gradient-to-br from-[var(--accent-primary)] to-rose-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-2 text-white/80 text-sm font-medium mb-3">
            <Wallet className="w-4 h-4" /> Solde Actuel
          </div>
          <div className="text-4xl font-extrabold tracking-tight">
            {balance.toFixed(2)} €
          </div>
          {balance < 5 && (
            <div className="mt-3 flex items-center gap-2 text-xs bg-white/20 text-white p-2 rounded-lg">
              <AlertCircle className="w-3.5 h-3.5" /> Solde faible — rechargez pour continuer
            </div>
          )}
        </div>

        {/* Current Plan */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6">
          <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm font-medium mb-3">
            <Zap className="w-4 h-4" /> Plan Actuel
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-lg font-bold px-2.5 py-0.5 rounded-full text-sm border ${currentPlan.color}`}>
              {currentPlan.label}
            </span>
            {isActive && (
              <span className="text-xs text-emerald-500 font-medium">Actif</span>
            )}
          </div>
          <div className="space-y-1 text-xs text-[var(--text-secondary)] mt-3">
            <div className="flex items-center gap-1.5">
              <Phone className="w-3 h-3" /> Appels vocaux IA
            </div>
            <div className="flex items-center gap-1.5">
              <MessageSquare className="w-3 h-3" /> SMS & WhatsApp
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="w-3 h-3" /> Agents IA automatisés
            </div>
          </div>
        </div>

        {/* Top Up */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6">
          <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm font-medium mb-3">
            <CreditCard className="w-4 h-4" /> Recharger
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {topAmounts.map((amount) => (
              <button
                key={amount}
                onClick={() => handleTopUp(amount, "stripe")}
                disabled={!!toppingUp}
                className="px-3 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-hover)] hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/5 text-[var(--text-primary)] font-bold text-sm transition-all disabled:opacity-50"
              >
                {amount}€
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              min="5"
              placeholder="Montant"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="flex-1 bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
            />
            <button
              onClick={() => handleCustomTopUp("stripe")}
              disabled={!!toppingUp || !customAmount}
              className="px-4 py-2 rounded-xl bg-[var(--accent-primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5"
            >
              {toppingUp === "stripe" ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
            </button>
          </div>
          <button
            onClick={() => {
              const amount = parseFloat(customAmount) || 10;
              handleTopUp(amount, "flutterwave");
            }}
            disabled={!!toppingUp}
            className="w-full mt-2 px-4 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] text-xs font-medium hover:text-[var(--text-primary)] hover:border-[var(--accent-primary)] transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {toppingUp === "flutterwave" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>Via Flutterwave <ExternalLink className="w-3 h-3" /></>
            )}
          </button>
        </div>
      </div>

      {/* Transaction History */}
      {showHistory && (
        <div className="mt-6 border-t border-[var(--border-subtle)] pt-6">
          <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3">Historique des Transactions</h3>
          {loadingHistory ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-[var(--text-secondary)]" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-6 text-sm text-[var(--text-secondary)] border border-dashed border-[var(--border-subtle)] rounded-xl">
              Aucune transaction pour le moment.
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {transactions.map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between p-3 bg-[var(--bg-surface-hover)] rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-full ${tx.type === "CREDIT" ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}`}>
                      {tx.type === "CREDIT" ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{tx.description}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{new Date(tx.createdAt).toLocaleString("fr-FR")}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-bold ${tx.type === "CREDIT" ? "text-emerald-500" : "text-[var(--text-primary)]"}`}>
                    {tx.type === "CREDIT" ? "+" : "-"}{Math.abs(tx.amount).toFixed(2)} €
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
