"use client";

import { useState, useEffect } from "react";
import { Search, Globe, ShoppingCart, Loader2, Phone, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { COUNTRIES } from "@/lib/countries";

type AvailableNumber = {
  phone_number: string;
  country_code: string;
  features: string[];
  cost: number;
};

export default function BuyNumberPage() {
  const [country, setCountry] = useState("US");
  const [locality, setLocality] = useState("");
  const [state, setState] = useState("");
  const [areaCode, setAreaCode] = useState("");
  const [phoneNumberType, setPhoneNumberType] = useState("");
  const [featureVoice, setFeatureVoice] = useState(false);
  const [featureSms, setFeatureSms] = useState(false);
  const [featureMms, setFeatureMms] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [numbers, setNumbers] = useState<AvailableNumber[]>([]);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const router = useRouter();

  const searchNumbers = async () => {
    setLoading(true);
    setNumbers([]);
    
    // Build query params
    const params = new URLSearchParams();
    params.set("country", country);
    if (locality) params.set("locality", locality);
    if (state) params.set("state", state);
    if (areaCode) params.set("area_code", areaCode);
    if (phoneNumberType) params.set("type", phoneNumberType);
    if (featureVoice) params.append("features", "voice");
    if (featureSms) params.append("features", "sms");
    if (featureMms) params.append("features", "mms");

    try {
      const res = await fetch(`/api/telecom/numbers/search?${params.toString()}`);
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
      const res = await fetch('/api/telecom/numbers/buy', {
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

      {/* Advanced Search Filters */}
      <div className="glass-panel p-6 mb-8 flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col">
            <label className="text-sm font-semibold text-[var(--text-secondary)] mb-2">Pays (Code ISO)</label>
            <div className="relative">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
              <select 
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-lg text-sm font-medium text-[var(--text-primary)] focus:outline-none focus:border-cyan-500 appearance-none"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex flex-col">
            <label className="text-sm font-semibold text-[var(--text-secondary)] mb-2">État / Région (ex: IL, TX)</label>
            <input 
              type="text" 
              placeholder="État ou Province" 
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full px-4 py-2.5 bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-semibold text-[var(--text-secondary)] mb-2">Ville (Locality)</label>
            <input 
              type="text" 
              placeholder="Ex: Chicago" 
              value={locality}
              onChange={(e) => setLocality(e.target.value)}
              className="w-full px-4 py-2.5 bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-semibold text-[var(--text-secondary)] mb-2">Area Code</label>
            <input 
              type="text" 
              placeholder="Ex: 312" 
              value={areaCode}
              onChange={(e) => setAreaCode(e.target.value)}
              className="w-full px-4 py-2.5 bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pt-4 border-t border-[var(--border-subtle)]">
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold text-[var(--text-secondary)]">Type:</label>
              <select 
                value={phoneNumberType}
                onChange={(e) => setPhoneNumberType(e.target.value)}
                className="bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded text-xs px-2 py-1 text-[var(--text-primary)] focus:outline-none focus:border-cyan-500"
              >
                <option value="">Tous</option>
                <option value="local">Local</option>
                <option value="toll_free">Numéro Vert (Toll-Free)</option>
                <option value="mobile">Mobile</option>
                <option value="national">National</option>
              </select>
            </div>
            
            <div className="flex items-center gap-4">
              <label className="text-sm font-semibold text-[var(--text-secondary)]">Fonctionnalités:</label>
              <label className="flex items-center gap-2 text-sm text-[var(--text-primary)] cursor-pointer">
                <input type="checkbox" checked={featureVoice} onChange={(e) => setFeatureVoice(e.target.checked)} className="rounded bg-[var(--bg-surface-solid)] border-[var(--border-subtle)] text-cyan-500 focus:ring-cyan-500" />
                Voice
              </label>
              <label className="flex items-center gap-2 text-sm text-[var(--text-primary)] cursor-pointer">
                <input type="checkbox" checked={featureSms} onChange={(e) => setFeatureSms(e.target.checked)} className="rounded bg-[var(--bg-surface-solid)] border-[var(--border-subtle)] text-cyan-500 focus:ring-cyan-500" />
                SMS
              </label>
              <label className="flex items-center gap-2 text-sm text-[var(--text-primary)] cursor-pointer">
                <input type="checkbox" checked={featureMms} onChange={(e) => setFeatureMms(e.target.checked)} className="rounded bg-[var(--bg-surface-solid)] border-[var(--border-subtle)] text-cyan-500 focus:ring-cyan-500" />
                MMS
              </label>
            </div>
          </div>
          
          <button onClick={searchNumbers} disabled={loading} className="btn-primary-gradient px-8 py-2.5 h-[42px] flex items-center justify-center gap-2 w-full lg:w-auto shrink-0">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Rechercher
          </button>
        </div>
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
                    <span className="block text-lg font-bold text-emerald-400">${(num.cost || 0).toFixed(2)}</span>
                    <span className="text-xs font-medium text-[var(--text-secondary)]">/ mois</span>
                  </div>
                </div>
                
                <h2 className="text-2xl font-bold font-mono tracking-tight text-[var(--text-primary)] mb-2">
                  {num.phone_number}
                </h2>
                
                <div className="flex flex-wrap gap-2 mb-8">
                  {(num.features || []).map((feat: string) => (
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
