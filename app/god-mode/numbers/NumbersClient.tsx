"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

type DbNumber = any;

export function NumbersClient({ existingNumbers, organizations = [] }: { existingNumbers: DbNumber[], organizations?: any[] }) {
  const router = useRouter();
  const [countryCode, setCountryCode] = useState("US");
  const [limit, setLimit] = useState("10");
  const [features, setFeatures] = useState({ voice: true, sms: true });
  const [purchaseOrganizationId, setPurchaseOrganizationId] = useState(organizations[0]?.id || "");
  
  const [numbers, setNumbers] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isBuying, setIsBuying] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [routingNumber, setRoutingNumber] = useState<DbNumber | null>(null);
  const [routingMode, setRoutingMode] = useState<"APP" | "FORWARD" | "APP_THEN_FORWARD">("APP");
  const [routingEnabled, setRoutingEnabled] = useState(true);
  const [forwardToE164, setForwardToE164] = useState("");
  const [ringAppSeconds, setRingAppSeconds] = useState("15");
  const [isSavingRouting, setIsSavingRouting] = useState(false);

  const openRouting = (number: DbNumber) => {
    setRoutingNumber(number);
    setRoutingMode(number.incomingRoutingMode || "APP");
    setRoutingEnabled(number.incomingRoutingEnabled !== false);
    setForwardToE164(number.forwardToE164 || "");
    setRingAppSeconds(String(number.ringAppSeconds ?? 15));
    setError(null);
    setSuccess(null);
  };

  const saveRouting = async () => {
    if (!routingNumber) return;
    setIsSavingRouting(true);
    setError(null);
    try {
      const response = await fetch(`/api/phone-numbers/${routingNumber.id}/routing`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: routingMode,
          isEnabled: routingEnabled,
          forwardToE164: routingMode === "APP" ? null : forwardToE164,
          ringAppSeconds: Number(ringAppSeconds),
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Impossible d'enregistrer le routage.");
      setSuccess(`Routage ${result.mode} enregistré pour ${routingNumber.number}.`);
      setRoutingNumber(null);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSavingRouting(false);
    }
  };

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
    if (!purchaseOrganizationId) {
      setError("Sélectionnez l'organisation qui achète et paie ce numéro.");
      return;
    }
    setIsBuying(phoneNumber);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/admin/telnyx/numbers/buy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, organizationId: purchaseOrganizationId }),
      });
      
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to buy number");

      setSuccess(data.order?.status === "ACTIVE"
        ? `${phoneNumber} a été acheté et relié à la connexion vocale.`
        : `La commande de ${phoneNumber} est acceptée par Telnyx ; l'activation est en cours.`);
      setNumbers((prev) => prev.filter(n => n.phone_number !== phoneNumber));
      // Typically would refresh router here to see the new number in existingNumbers
      // router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsBuying(null);
    }
  };

  const syncNumbers = async () => {
    setIsSyncing(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/admin/telnyx/numbers/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to sync numbers");
      setSuccess(`Synchronisation réussie ! ${data.count} numéros ajoutés/mis à jour. Actualisez la page pour les voir.`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const assignOrganization = async (numberId: string, organizationId: string) => {
    try {
      const res = await fetch(`/api/admin/telnyx/numbers/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numberId, organizationId: organizationId || null }),
      });
      if (!res.ok) throw new Error("Failed to assign organization");
      setSuccess("Numéro réassigné avec succès.");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Number Inventory</h1>
        <p className="text-[var(--text-secondary)]">View allocated numbers and provision new ones via Telnyx.</p>
      </div>

      {/* Global Numbers List */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Provisioned Numbers</h2>
        <button
          onClick={syncNumbers}
          disabled={isSyncing}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded-lg hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/30 transition-all text-sm font-medium disabled:opacity-50"
        >
          {isSyncing ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Syncing...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21v-5h5"/></svg>
              Synchroniser depuis Telnyx
            </>
          )}
        </button>
      </div>
      
      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-sm">
          {success}
        </div>
      )}

      <div className="glass-panel border-none rounded-2xl overflow-hidden shadow-2xl mb-12">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--bg-surface-hover)] border-b border-[var(--border-subtle)] text-[var(--text-secondary)]">
            <tr>
              <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Phone Number</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Organization</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Routage entrant</th>
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
                  <select 
                    value={num.organizationId || ""}
                    onChange={(e) => assignOrganization(num.id, e.target.value)}
                    className="bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded px-2 py-1 text-sm focus:outline-none focus:border-cyan-500 text-[var(--text-primary)] min-w-[150px]"
                  >
                    <option value="">-- Unassigned --</option>
                    {organizations.map(org => (
                      <option key={org.id} value={org.id}>{org.name}</option>
                    ))}
                  </select>
                </td>
                <td className="px-6 py-4">
                  <div className="font-semibold text-cyan-300">{num.incomingRoutingEnabled === false ? "DÉSACTIVÉ" : num.incomingRoutingMode || "APP"}</div>
                  <div className="text-xs text-[var(--text-secondary)] mt-1">
                    {num.forwardToE164 || "Softphone WebRTC"}
                    {num.incomingRoutingMode === "APP_THEN_FORWARD" ? ` après ${num.ringAppSeconds ?? 15}s` : ""}
                  </div>
                  <button onClick={() => openRouting(num)} className="mt-2 px-3 py-1 border border-cyan-500/30 text-cyan-300 rounded text-xs hover:bg-cyan-500/10">
                    Configurer
                  </button>
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
                <td colSpan={4} className="px-6 py-12 text-center text-[var(--text-secondary)]">
                   No numbers provisioned in the database yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {routingNumber && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-solid)] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h2 className="text-xl font-bold">Routage réel du numéro</h2>
                <p className="font-mono text-sm text-cyan-300 mt-1">{routingNumber.number}</p>
              </div>
              <button onClick={() => setRoutingNumber(null)} className="text-[var(--text-secondary)] hover:text-white">✕</button>
            </div>
            <div className="space-y-4">
              <label className="flex items-center gap-3 text-sm">
                <input type="checkbox" checked={routingEnabled} onChange={(event) => setRoutingEnabled(event.target.checked)} />
                Routage entrant activé
              </label>
              <label className="block text-sm text-[var(--text-secondary)]">
                Mode
                <select value={routingMode} onChange={(event) => setRoutingMode(event.target.value as typeof routingMode)} className="mt-1 w-full rounded-lg border border-[var(--border-subtle)] bg-[#121212] px-3 py-2 text-white">
                  <option value="APP">APP — softphone WebRTC</option>
                  <option value="FORWARD">FORWARD — téléphone externe</option>
                  <option value="APP_THEN_FORWARD">APP_THEN_FORWARD — application puis téléphone</option>
                </select>
              </label>
              {routingMode !== "APP" && (
                <label className="block text-sm text-[var(--text-secondary)]">
                  Destination PSTN (E.164)
                  <input value={forwardToE164} onChange={(event) => setForwardToE164(event.target.value)} placeholder="+2376XXXXXXXX" className="mt-1 w-full rounded-lg border border-[var(--border-subtle)] bg-[#121212] px-3 py-2 font-mono text-white" />
                </label>
              )}
              {routingMode === "APP_THEN_FORWARD" && (
                <label className="block text-sm text-[var(--text-secondary)]">
                  Sonnerie dans l’application (5–60 secondes)
                  <input type="number" min="5" max="60" value={ringAppSeconds} onChange={(event) => setRingAppSeconds(event.target.value)} className="mt-1 w-full rounded-lg border border-[var(--border-subtle)] bg-[#121212] px-3 py-2 text-white" />
                </label>
              )}
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-200">
                Telnyx ne reçoit aucune destination choisie depuis le navigateur. Le backend valide le plan, le wallet, les restrictions et déclenche le leg PSTN avec le SDK.
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setRoutingNumber(null)} className="px-4 py-2 rounded-lg border border-[var(--border-subtle)]">Annuler</button>
              <button onClick={saveRouting} disabled={isSavingRouting} className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 font-semibold disabled:opacity-50">
                {isSavingRouting ? "Enregistrement…" : "Enregistrer dans Code Mode"}
              </button>
            </div>
          </div>
        </div>
      )}

      <h2 className="text-xl font-bold mb-4">Purchase New Numbers</h2>
      {/* Search Console */}
      <div className="glass-panel border-none rounded-2xl p-6 mb-8 shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div>
            <label className="block text-xs uppercase tracking-wider text-[var(--text-secondary)] mb-2">Organisation facturée</label>
            <select
              value={purchaseOrganizationId}
              onChange={(event) => setPurchaseOrganizationId(event.target.value)}
              className="w-full bg-[#121212] border border-[var(--border-subtle)] rounded-lg px-4 py-2 text-[var(--text-primary)] outline-none focus:border-red-500/50"
            >
              <option value="">Sélectionner…</option>
              {organizations.map((organization) => (
                <option key={organization.id} value={organization.id}>{organization.name}</option>
              ))}
            </select>
          </div>
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
                     ${Number(num.retail_price).toFixed(4)} <span className="text-xs text-[var(--text-primary)]/30">prix client</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => buyNumber(num.phone_number)}
                      disabled={isBuying === num.phone_number || !purchaseOrganizationId}
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
