"use client";

import { useState, useEffect } from "react";
import { searchNumbers, buyNumber } from "./actions";
import { useRouter } from "next/navigation";
import { Search, Phone, Loader2 } from "lucide-react";

export default function OnboardingNumberPage() {
  const [country, setCountry] = useState("US");
  const [numbers, setNumbers] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isBuying, setIsBuying] = useState<string | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSearch = async () => {
    setIsSearching(true);
    setError("");
    try {
      const res = await searchNumbers(country);
      if (res.error) {
        setError(res.error);
      } else if (res.numbers) {
        setNumbers(res.numbers);
      }
    } catch (err) {
      setError("An error occurred while searching");
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    handleSearch();
  }, [country]);

  const handleBuy = async (phoneNumber: string) => {
    setIsBuying(phoneNumber);
    setError("");
    try {
      const res = await buyNumber(phoneNumber);
      if (res.error) {
        setError(res.error);
        setIsBuying(null);
      } else {
        // Success, redirect to softphone
        router.push("/dashboard/softphone");
      }
    } catch (err) {
      setError("An error occurred while purchasing the number");
      setIsBuying(null);
    }
  };

  return (
    <div className="w-full max-w-md glass-panel p-8 sm:p-10 relative mx-auto mt-10">
      <div className="relative z-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2 tracking-tight text-[var(--text-primary)]">Pick a phone number</h1>
          <p className="text-[var(--text-secondary)] text-[15px]">Choose a local or toll-free number for your business. (Free during trial).</p>
        </div>

      {error && (
        <div className="mb-8 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[14px]">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <select 
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-xl px-4 py-3 text-[15px] focus:outline-none focus:border-[var(--border-glow)] transition-colors flex-1"
        >
          <option value="US">United States (+1)</option>
          <option value="CA">Canada (+1)</option>
          <option value="GB">United Kingdom (+44)</option>
          <option value="FR">France (+33)</option>
        </select>
        <button 
          onClick={handleSearch}
          disabled={isSearching}
          className="btn-primary flex justify-center items-center gap-2 py-3 px-6 text-[15px]"
        >
          {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          {isSearching ? "Searching" : "Search"}
        </button>
      </div>

      <div className="space-y-4">
        {numbers.length === 0 && !isSearching && (
          <div className="text-center py-10 text-[var(--text-secondary)] border border-dashed border-[var(--border-subtle)] rounded-xl bg-[var(--bg-surface-solid)]/50">
            No numbers found for this region.
          </div>
        )}

        {numbers.map((num) => (
          <div key={num.phone_number} className="flex items-center justify-between p-5 rounded-xl border border-[var(--border-subtle)] hover:border-[var(--border-glow)] bg-[var(--bg-surface-solid)] transition-colors group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-cyan-500/10 text-cyan-500 flex items-center justify-center border border-cyan-500/20">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <div className="text-lg font-bold tracking-tight text-[var(--text-primary)]">{num.phone_number}</div>
                <div className="text-sm text-[var(--text-secondary)] font-medium">
                  {num.locality ? `${num.locality}, ${num.administrative_area}` : "National"}
                </div>
              </div>
            </div>
            <button 
              onClick={() => handleBuy(num.phone_number)}
              disabled={isBuying !== null}
              className="px-6 py-2.5 rounded-full font-bold text-sm transition-all duration-200 bg-[var(--bg-base)] text-[var(--text-primary)] border border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)] disabled:opacity-50 disabled:hover:bg-[var(--bg-base)]"
            >
              {isBuying === num.phone_number ? <Loader2 className="w-4 h-4 animate-spin" /> : "Select"}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <button 
          onClick={() => router.push("/dashboard")}
          className="text-[14px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors underline-offset-4 hover:underline"
        >
          Skip this step for now
        </button>
      </div>
      </div>
    </div>
  );
}
