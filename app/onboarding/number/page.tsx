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
    <div className="w-full max-w-2xl apple-surface p-8 sm:p-12 relative">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-3 tracking-tight">Pick your phone number</h1>
        <p className="text-[var(--apple-text-secondary)] text-[16px]">Choose a local or toll-free number for your business. Your first number is free during the trial.</p>
      </div>

      {error && (
        <div className="mb-8 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[14px]">
          {error}
        </div>
      )}

      <div className="flex gap-4 mb-8">
        <select 
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="bg-[var(--apple-bg-primary)] border border-[var(--apple-border)] rounded-xl px-4 py-3 text-[15px] focus:outline-none focus:border-[var(--apple-accent)] transition-colors"
        >
          <option value="US">United States (+1)</option>
          <option value="CA">Canada (+1)</option>
          <option value="GB">United Kingdom (+44)</option>
          <option value="FR">France (+33)</option>
        </select>
        <button 
          onClick={handleSearch}
          disabled={isSearching}
          className="flex-1 apple-btn flex justify-center items-center gap-2"
        >
          {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          {isSearching ? "Searching..." : "Search Available Numbers"}
        </button>
      </div>

      <div className="space-y-4">
        {numbers.length === 0 && !isSearching && (
          <div className="text-center py-10 text-[var(--apple-text-secondary)] border border-dashed border-[var(--apple-border)] rounded-xl">
            No numbers found for this region.
          </div>
        )}

        {numbers.map((num) => (
          <div key={num.phone_number} className="flex items-center justify-between p-5 rounded-xl border border-[var(--apple-border)] hover:border-[var(--apple-accent)]/50 bg-[var(--apple-bg-primary)] transition-colors group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[var(--apple-accent)]/10 text-[var(--apple-accent)] flex items-center justify-center">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <div className="text-lg font-semibold tracking-wide">{num.phone_number}</div>
                <div className="text-sm text-[var(--apple-text-secondary)]">
                  {num.locality ? `${num.locality}, ${num.administrative_area}` : "National"}
                </div>
              </div>
            </div>
            <button 
              onClick={() => handleBuy(num.phone_number)}
              disabled={isBuying !== null}
              className="px-6 py-2.5 rounded-full font-medium text-sm transition-all duration-200 bg-[var(--apple-text-primary)] text-[var(--apple-bg-primary)] hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
            >
              {isBuying === num.phone_number ? <Loader2 className="w-4 h-4 animate-spin" /> : "Select"}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <button 
          onClick={() => router.push("/dashboard")}
          className="text-sm font-medium text-[var(--apple-text-secondary)] hover:text-[var(--apple-text-primary)] transition-colors underline-offset-4 hover:underline"
        >
          Skip this step for now (I'll do it later)
        </button>
      </div>
    </div>
  );
}
