"use client";

import { useState, useEffect } from "react";
import { Search, Globe, ShoppingCart, Loader2, Phone, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type AvailableNumber = {
  phone_number: string;
  country_code: string;
  features: string[];
  cost: number;
};

export default function BuyNumberPage() {
  const [country, setCountry] = useState("US");
  const [loading, setLoading] = useState(false);
  const [numbers, setNumbers] = useState<AvailableNumber[]>([]);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const router = useRouter();

  const searchNumbers = async () => {
    setLoading(true);
    setNumbers([]);
    try {
      const res = await fetch(`/api/telecom/numbers/search?country=${country}`);
      if (res.ok) {
        const data = await res.json();
        setNumbers(data.numbers || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Load some numbers on mount
  useEffect(() => {
    searchNumbers();
  }, []);

  const handlePurchase = async (phoneNumber: string, cost: number) => {
    setPurchasing(phoneNumber);
    try {
      const res = await fetch('/api/telnyx/numbers/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, cost })
      });
      const data = await res.json();

      if (res.ok) {
        router.push('/dashboard/numbers?success=true');
        router.refresh();
      } else {
        alert(`Erreur: ${data.error}`);
      }
    } catch (e) {
      alert("Erreur lors de l'achat");
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <Link href="/dashboard/numbers" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-2 mb-6 w-fit">
        <ArrowLeft className="w-4 h-4" /> Retour à l'inventaire
      </Link>

      <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Boutique de Numéros</h1>
          <p className="text-[var(--text-secondary)]">Établissez une présence locale n'importe où dans le monde.</p>
        </div>
      </div>

      {/* Search Filters */}
      <div className="glass-panel p-6 mb-8 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">Pays (Code ISO)</label>
          <div className="relative">
            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
            <select 
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-xl font-medium text-[var(--text-primary)] focus:outline-none focus:border-cyan-500 appearance-none"
            >
              <option value="US">🇺🇸 États-Unis (US)</option>
              <option value="CA">🇨🇦 Canada (CA)</option>
              <option value="FR">🇫🇷 France (FR)</option>
              <option value="GB">🇬🇧 Royaume-Uni (GB)</option>
              <option value="BE">🇧🇪 Belgique (BE)</option>
              <option value="CH">🇨🇭 Suisse (CH)</option>
            </select>
          </div>
        </div>
        <button onClick={searchNumbers} disabled={loading} className="btn-primary-gradient px-8 py-3 h-[50px] flex items-center justify-center gap-2">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          Rechercher
        </button>
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 text-[var(--text-secondary)]">
          <Loader2 className="w-10 h-10 animate-spin text-cyan-500 mb-4" />
          <p>Recherche de numéros premium chez Telnyx...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {numbers.length === 0 ? (
             <div className="col-span-full p-12 text-center text-[var(--text-secondary)] bg-[var(--bg-surface-hover)] rounded-3xl border border-[var(--border-subtle)]">
               Aucun numéro trouvé pour ce critère.
             </div>
          ) : (
            numbers.map((num) => (
              <div key={num.phone_number} className="glass-panel p-6 relative overflow-hidden flex flex-col group hover:border-cyan-500/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,212,255,0.1)]">
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-[var(--bg-surface-hover)] rounded-xl border border-[var(--border-subtle)] group-hover:bg-cyan-500/10 group-hover:border-cyan-500/20 transition-colors">
                    <Phone className="w-6 h-6 text-[var(--text-primary)] group-hover:text-cyan-400 transition-colors" />
                  </div>
                  <div className="text-right">
                    <span className="block text-lg font-bold text-emerald-400">${num.cost.toFixed(2)}</span>
                    <span className="text-xs font-medium text-[var(--text-secondary)]">/ mois</span>
                  </div>
                </div>
                
                <h2 className="text-2xl font-bold font-mono tracking-tight text-[var(--text-primary)] mb-2">
                  {num.phone_number}
                </h2>
                
                <div className="flex flex-wrap gap-2 mb-8">
                  {num.features.map(feat => (
                    <span key={feat} className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
                      {feat}
                    </span>
                  ))}
                </div>
                
                <button 
                  onClick={() => handlePurchase(num.phone_number, num.cost)}
                  disabled={purchasing === num.phone_number}
                  className="mt-auto w-full py-3 bg-[var(--bg-surface-solid)] hover:bg-cyan-500 hover:text-[var(--bg-base)] border border-[var(--border-subtle)] hover:border-cyan-500 text-[var(--text-primary)] rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                >
                  {purchasing === num.phone_number ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <><ShoppingCart className="w-4 h-4" /> Acheter ce numéro</>
                  )}
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
