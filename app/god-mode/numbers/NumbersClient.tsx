"use client";

import { useState } from "react";

type DbNumber = any;

export function NumbersClient({ existingNumbers }: { existingNumbers: DbNumber[] }) {
  const [countryCode, setCountryCode] = useState("US");
  const [limit, setLimit] = useState("10");
  const [features, setFeatures] = useState({ voice: true, sms: true });
  
  const [numbers, setNumbers] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isBuying, setIsBuying] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const searchNumbers = async () => {
    setIsSearching(true);
    setError(null);
    setSuccess(null);
    setNumbers([]);

    try {
      const featArray = [];
      if (features.voice) featArray.push("voice");
      if (features.sms) featArray.push("sms");
      const featString = featArray.join(",");

      const params = new URLSearchParams({
        country_code: countryCode,
        limit,
        ...(featString && { features: featString })
      });

      const res = await fetch(`/api/admin/telnyx/numbers/search?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to fetch numbers");

      setNumbers(data.numbers || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSearching(false);
    }
  };

  const buyNumber = async (phoneNumber: string) => {
    setIsBuying(phoneNumber);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/admin/telnyx/numbers/buy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });
      
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to buy number");

      setSuccess(`Successfully purchased ${phoneNumber}! It is now linked to your SIP connection.`);
      setNumbers((prev) => prev.filter(n => n.phone_number !== phoneNumber));
      // Typically would refresh router here to see the new number in existingNumbers
      // router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsBuying(null);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Number Inventory</h1>
        <p className="text-[var(--text-secondary)]">View allocated numbers and provision new ones via Telnyx.</p>
      </div>

      {/* Global Numbers List */}
      <h2 className="text-xl font-bold mb-4">Provisioned Numbers</h2>
      <div className="glass-panel border-none rounded-2xl overflow-hidden shadow-2xl mb-12">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--bg-surface-hover)] border-b border-[var(--border-subtle)] text-[var(--text-secondary)]">
            <tr>
              <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Phone Number</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Organization</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs text-right">Capabilities</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {existingNumbers.map((num: any) => (
              <tr key={num.id} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-[var(--text-primary)] font-mono text-base">{num.number}</div>
                  <div className="text-[var(--text-secondary)] text-xs mt-1">Telnyx ID: {num.telnyxId || "N/A"}</div>
                </td>
                <td className="px-6 py-4">
                  {num.organization ? (
                    <div className="text-[var(--text-primary)] font-medium">{num.organization.name}</div>
                  ) : (
                    <div className="text-[var(--text-secondary)] italic">Unassigned</div>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                   <div className="flex items-center justify-end gap-2">
                     <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${num.capabilities?.includes('voice') ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-white/30 border border-white/10'}`}>Voice</span>
                     <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${num.capabilities?.includes('sms') ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-white/5 text-white/30 border border-white/10'}`}>SMS</span>
                   </div>
                </td>
              </tr>
            ))}
            {existingNumbers.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-[var(--text-secondary)]">
                   No numbers provisioned in the database yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 className="text-xl font-bold mb-4">Purchase New Numbers</h2>
      {/* Search Console */}
      <div className="glass-panel border-none rounded-2xl p-6 mb-8 shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <label className="block text-xs uppercase tracking-wider text-[var(--text-secondary)] mb-2">Country Code</label>
            <input 
              type="text" 
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
              className="w-full bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded-lg px-4 py-2 text-[var(--text-primary)] outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all"
              placeholder="US, FR, GB..."
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-[var(--text-secondary)] mb-2">Result Limit</label>
            <select 
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              className="w-full bg-[#121212] border border-[var(--border-subtle)] rounded-lg px-4 py-2 text-[var(--text-primary)] outline-none focus:border-red-500/50"
            >
              <option value="10">10 numbers</option>
              <option value="25">25 numbers</option>
              <option value="50">50 numbers</option>
            </select>
          </div>
          <div className="flex items-center gap-4">
             <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={features.voice} onChange={(e) => setFeatures(p => ({...p, voice: e.target.checked}))} className="accent-red-500 w-4 h-4" />
                Voice
             </label>
             <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={features.sms} onChange={(e) => setFeatures(p => ({...p, sms: e.target.checked}))} className="accent-red-500 w-4 h-4" />
                SMS
             </label>
          </div>
          <div className="flex items-end">
            <button 
              onClick={searchNumbers}
              disabled={isSearching}
              className="w-full py-2 bg-white text-black hover:bg-gray-200 disabled:opacity-50 rounded-lg font-medium transition-colors"
            >
              {isSearching ? "Searching API..." : "Search Numbers"}
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-sm">
          {success}
        </div>
      )}

      {/* Results */}
      {numbers.length > 0 && (
        <div className="glass-panel border-none rounded-2xl overflow-hidden shadow-2xl">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--bg-surface-hover)] border-b border-[var(--border-subtle)] text-[var(--text-secondary)]">
              <tr>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Number</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Locality</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Type</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Cost</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {numbers.map((num) => (
                <tr key={num.phone_number} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                  <td className="px-6 py-4 font-mono text-lg text-[var(--text-primary)]">{num.phone_number}</td>
                  <td className="px-6 py-4 text-[var(--text-secondary)]">
                     {num.locality ? `${num.locality}, ` : ''}{num.administrative_area ? `${num.administrative_area}, ` : ''}{num.country_code}
                  </td>
                  <td className="px-6 py-4">
                     <span className="px-2 py-1 bg-[var(--bg-surface-hover)] rounded text-xs text-[var(--text-primary)]/70 capitalize">{num.phone_number_type}</span>
                  </td>
                  <td className="px-6 py-4 text-[var(--text-secondary)]">
                     ${num.cost_information?.upfront_cost || "1.00"} <span className="text-xs text-[var(--text-primary)]/30">upfront</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => buyNumber(num.phone_number)}
                      disabled={isBuying === num.phone_number}
                      className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-[var(--text-primary)] rounded-lg text-xs font-bold transition-colors"
                    >
                      {isBuying === num.phone_number ? "Processing..." : "Buy Number"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
