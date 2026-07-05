"use client";

import { useState, useTransition, useEffect } from "react";
import { 
  saveTelnyxApiKey, 
  fetchTelnyxBalance,
  fetchMessagingProfiles,
  fetchCallControlApps,
  searchGlobalNumbers,
  purchaseAndAssignNumber,
  getOrganizationsList,
  fetchRecentMessages,
  fetchOutboundProfiles,
  createOutboundProfile,
  updateOutboundProfile,
  fetchCredentialConnections,
  assignOutboundProfileToConnection
} from "./actions";

export function TelnyxHubClient({ initialSettings }: { initialSettings: any }) {
  const [apiKey, setApiKey] = useState(initialSettings?.telnyxApiKey || "");
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState("overview");

  // Data states
  const [balanceData, setBalanceData] = useState<any>(null);
  const [messagingProfiles, setMessagingProfiles] = useState<any[]>([]);
  const [callApps, setCallApps] = useState<any[]>([]);
  const [outboundProfiles, setOutboundProfiles] = useState<any[]>([]);
  const [credentialConnections, setCredentialConnections] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [newProfileLimit, setNewProfileLimit] = useState("10");
  const [error, setError] = useState<string | null>(null);

  // Numbers State
  const [searchCountry, setSearchCountry] = useState("US");
  const [availableNumbers, setAvailableNumbers] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [purchasingNumber, setPurchasingNumber] = useState<string | null>(null);
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");

  // Diagnostics State
  const [recentMessages, setRecentMessages] = useState<any[]>([]);

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      await saveTelnyxApiKey(apiKey);
      loadTelnyxData(apiKey);
    });
  };

  const loadTelnyxData = async (key: string) => {
    if (!key) return;
    setLoadingData(true);
    setError(null);
    try {
      const [balRes, msgRes, callRes, logsRes, outProfRes, credConnRes] = await Promise.all([
        fetchTelnyxBalance(key),
        fetchMessagingProfiles(key),
        fetchCallControlApps(key),
        fetchRecentMessages(key),
        fetchOutboundProfiles(key),
        fetchCredentialConnections(key)
      ]);

      if (balRes.error) throw new Error(balRes.error);
      setBalanceData(balRes.data);
      
      if (msgRes.data) setMessagingProfiles(msgRes.data);
      if (callRes.data) setCallApps(callRes.data);
      if (logsRes.data) setRecentMessages(logsRes.data);
      if (outProfRes.data) setOutboundProfiles(outProfRes.data);
      if (credConnRes.data) setCredentialConnections(credConnRes.data);

    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSearchNumbers = async () => {
    setIsSearching(true);
    setError(null);
    try {
      const res = await searchGlobalNumbers(apiKey, searchCountry);
      if (res.error) throw new Error(res.error);
      setAvailableNumbers(res.data || []);
      
      const orgRes = await getOrganizationsList();
      if (orgRes.data) setOrganizations(orgRes.data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsSearching(false);
    }
  };

  const handlePurchase = async (phoneNumber: string) => {
    if (!selectedOrgId) {
      alert("Please select a Tenant (Organization) to assign this number to.");
      return;
    }
    setPurchasingNumber(phoneNumber);
    try {
      const res = await purchaseAndAssignNumber(apiKey, phoneNumber, selectedOrgId);
      if (res.error) throw new Error(res.error);
      alert(`Number ${phoneNumber} successfully purchased and assigned!`);
      // Remove from list
      setAvailableNumbers(prev => prev.filter(n => n.phone_number !== phoneNumber));
    } catch (e: any) {
      alert(e.message);
    } finally {
      setPurchasingNumber(null);
    }
  };

  const handleRefreshLogs = async () => {
    if (!apiKey) return;
    try {
      const logsRes = await fetchRecentMessages(apiKey);
      if (logsRes.data) setRecentMessages(logsRes.data);
    } catch (e: any) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (initialSettings?.telnyxApiKey) {
      loadTelnyxData(initialSettings.telnyxApiKey);
    }
  }, [initialSettings]);

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName) return;
    
    startTransition(async () => {
      const res = await createOutboundProfile(apiKey, {
        name: newProfileName,
        concurrent_call_limit: parseInt(newProfileLimit) || 10,
        billing_group_id: null
      });
      if (res.error) {
        alert(res.error);
        return;
      }
      setIsCreatingProfile(false);
      setNewProfileName("");
      await loadTelnyxData(apiKey);
    });
  };

  return (
    <div className="w-full">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Telnyx Mission Control</h1>
          <p className="text-[var(--text-secondary)]">Manage your master Telnyx account, view balance, and configure routing.</p>
        </div>
        
        {balanceData && (
          <div className="flex items-center gap-4 bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] p-4 rounded-xl shadow-lg">
            <div className="text-sm text-[var(--text-secondary)] uppercase tracking-wider font-bold">Master Balance</div>
            <div className={`text-2xl font-mono font-bold ${Number(balanceData.balance) < 20 ? 'text-red-500' : 'text-emerald-400'}`}>
              {balanceData.balance} {balanceData.currency}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-4 mb-6 border-b border-[var(--border-subtle)] overflow-x-auto pb-2">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 font-medium text-sm rounded-lg transition-colors whitespace-nowrap ${activeTab === 'overview' ? 'bg-[var(--bg-surface-hover)] text-white' : 'text-[var(--text-secondary)] hover:text-white'}`}
        >
          API Configuration
        </button>
        <button 
          onClick={() => setActiveTab('outbound')}
          className={`px-4 py-2 font-medium text-sm rounded-lg transition-colors whitespace-nowrap ${activeTab === 'outbound' ? 'bg-[var(--bg-surface-hover)] text-white' : 'text-[var(--text-secondary)] hover:text-white'}`}
        >
          Outbound Profiles
        </button>
        <button 
          onClick={() => setActiveTab('routing')}
          className={`px-4 py-2 font-medium text-sm rounded-lg transition-colors whitespace-nowrap ${activeTab === 'routing' ? 'bg-[var(--bg-surface-hover)] text-white' : 'text-[var(--text-secondary)] hover:text-white'}`}
        >
          Call Control & Messaging
        </button>
        <button 
          onClick={() => setActiveTab('numbers')}
          className={`px-4 py-2 font-medium text-sm rounded-lg transition-colors whitespace-nowrap ${activeTab === 'numbers' ? 'bg-[var(--bg-surface-hover)] text-white' : 'text-[var(--text-secondary)] hover:text-white'}`}
        >
          Global Numbers (Bloc 2)
        </button>
        <button 
          onClick={() => setActiveTab('diagnostics')}
          className={`px-4 py-2 font-medium text-sm rounded-lg transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'diagnostics' ? 'bg-[var(--bg-surface-hover)] text-white' : 'text-[var(--text-secondary)] hover:text-white'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h4l2-9 5 18 3-9h6"/></svg>
          API Logs & Debug
          {recentMessages.some(m => m.errors?.length > 0) && (
            <span className="flex h-2 w-2 rounded-full bg-red-500"></span>
          )}
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl flex items-start gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <div>
            <div className="font-bold">Telnyx API Error</div>
            <div className="text-sm opacity-80">{error}</div>
          </div>
        </div>
      )}

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-panel border-none rounded-2xl shadow-2xl p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
              Master API Key
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mb-6">
              This API key is used globally across the God Mode to manage Telnyx resources (fetch balances, buy numbers, list Webhooks).
              Do not share this key.
            </p>
            <form onSubmit={handleSaveKey} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">TELNYX_API_KEY (V2)</label>
                <div className="relative">
                  <input 
                    type="password" 
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="KEY018A..."
                    className="w-full bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded-lg px-4 py-3 pr-12 text-white font-mono focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </div>
                </div>
              </div>
              <button 
                type="submit" 
                disabled={isPending}
                className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium shadow-[0_0_15px_rgba(8,145,178,0.3)] transition-colors flex items-center gap-2"
              >
                {isPending && <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
                Save & Connect
              </button>
            </form>
          </div>

          <div className="glass-panel border-none rounded-2xl shadow-2xl p-6">
             <h2 className="text-xl font-bold mb-4">Account Status</h2>
             {loadingData ? (
               <div className="flex items-center justify-center h-32">
                 <div className="w-8 h-8 rounded-full border-2 border-cyan-500/30 border-t-cyan-500 animate-spin"></div>
               </div>
             ) : balanceData ? (
               <div className="space-y-4">
                 <div className="flex justify-between items-center p-4 bg-[var(--bg-surface-hover)] rounded-xl border border-[var(--border-subtle)]">
                   <span className="text-[var(--text-secondary)]">Available Credit</span>
                   <span className="font-bold text-lg">{balanceData.available_credit} {balanceData.currency}</span>
                 </div>
                 <div className="flex justify-between items-center p-4 bg-[var(--bg-surface-hover)] rounded-xl border border-[var(--border-subtle)]">
                   <span className="text-[var(--text-secondary)]">Credit Limit</span>
                   <span className="font-bold text-lg">{balanceData.credit_limit} {balanceData.currency}</span>
                 </div>
                 <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                   <div className="flex items-center gap-2 text-emerald-400 font-bold mb-1">
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                     API Connection Successful
                   </div>
                   <p className="text-sm text-emerald-400/80">Your God Mode is securely connected to Telnyx.</p>
                 </div>
               </div>
             ) : (
               <div className="flex items-center justify-center h-32 text-[var(--text-secondary)] text-sm text-center">
                 Enter your API key to fetch account status.
               </div>
             )}
          </div>
        </div>
      )}

      {activeTab === 'outbound' && (
        <div className="space-y-6">
          <div className="glass-panel border-none rounded-2xl shadow-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold">Outbound Voice Profiles</h2>
                <p className="text-sm text-[var(--text-secondary)] mt-1">Manage calling limits and billing settings.</p>
              </div>
              <button 
                onClick={() => setIsCreatingProfile(!isCreatingProfile)}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg transition-colors"
              >
                {isCreatingProfile ? "Cancel" : "+ Create Profile"}
              </button>
            </div>
            
            {isCreatingProfile && (
              <form onSubmit={handleCreateProfile} className="mb-6 p-4 bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded-xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm text-[var(--text-secondary)] mb-1">Profile Name (Required)</label>
                    <input 
                      type="text" 
                      value={newProfileName}
                      onChange={e => setNewProfileName(e.target.value)}
                      className="w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded px-3 py-2"
                      required
                      placeholder="e.g. Production Outbound"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[var(--text-secondary)] mb-1">Concurrent Channel Limit</label>
                    <input 
                      type="number" 
                      value={newProfileLimit}
                      onChange={e => setNewProfileLimit(e.target.value)}
                      className="w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded px-3 py-2"
                      min="1"
                    />
                  </div>
                </div>
                <button type="submit" disabled={isPending} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-sm font-bold disabled:opacity-50 flex items-center gap-2">
                  {isPending && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  Create
                </button>
              </form>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[var(--bg-surface-hover)] border-y border-[var(--border-subtle)] text-[var(--text-secondary)]">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Channels</th>
                    <th className="px-4 py-3 font-medium">Daily Spend Limit</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {outboundProfiles.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-[var(--text-secondary)]">
                        No Outbound Voice Profiles found.
                      </td>
                    </tr>
                  ) : (
                    outboundProfiles.map((prof) => (
                      <tr key={prof.id} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                        <td className="px-4 py-3 font-bold text-[var(--text-primary)]">{prof.name}</td>
                        <td className="px-4 py-3 text-[var(--text-secondary)]">{prof.concurrent_call_limit || "Unlimited"}</td>
                        <td className="px-4 py-3 text-[var(--text-secondary)]">{prof.daily_spend_limit_enabled ? `$${prof.daily_spend_limit}` : "Disabled"}</td>
                        <td className="px-4 py-3 text-right">
                          <button className="text-cyan-500 hover:text-cyan-400 font-medium text-xs">Edit</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="glass-panel border-none rounded-2xl shadow-2xl p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold">Connections & Applications (Assign Profile)</h2>
              <p className="text-sm text-[var(--text-secondary)] mt-1">Assign an Outbound Profile to your SIP Connections or Voice APIs to authorize outbound calling.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[var(--bg-surface-hover)] border-y border-[var(--border-subtle)] text-[var(--text-secondary)]">
                  <tr>
                    <th className="px-4 py-3 font-medium">Connection Name</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium text-right">Assigned Outbound Profile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {credentialConnections.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-[var(--text-secondary)]">
                        No connections found.
                      </td>
                    </tr>
                  ) : (
                    credentialConnections.map((conn) => (
                      <tr key={conn.id} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                        <td className="px-4 py-3 font-bold text-[var(--text-primary)]">{conn.user_name}</td>
                        <td className="px-4 py-3 text-[var(--text-secondary)]">Telephony Credential</td>
                        <td className="px-4 py-3 text-right">
                          <select 
                            className="bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded px-3 py-1 text-sm focus:outline-none focus:border-cyan-500 ml-auto block"
                            value={conn.outbound?.outbound_voice_profile_id || ""}
                            onChange={(e) => {
                              const newProfileId = e.target.value || null;
                              startTransition(async () => {
                                await assignOutboundProfileToConnection(apiKey, conn.id, newProfileId);
                                await loadTelnyxData(apiKey);
                              });
                            }}
                          >
                            <option value="">-- None --</option>
                            {outboundProfiles.map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'routing' && (
        <div className="space-y-6">
          <div className="glass-panel border-none rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-[var(--border-subtle)] bg-[var(--bg-surface-hover)] flex justify-between items-center">
              <h2 className="text-xl font-bold">Messaging Profiles (SMS/MMS)</h2>
              <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-bold rounded-full">{messagingProfiles.length} Profiles</span>
            </div>
            <div className="p-6">
              {messagingProfiles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {messagingProfiles.map(p => (
                    <div key={p.id} className="p-4 bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-xl relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                      <div className="font-bold text-[var(--text-primary)] mb-1 truncate">{p.name}</div>
                      <div className="text-xs text-[var(--text-secondary)] font-mono mb-3">{p.id}</div>
                      
                      <div className="text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-[var(--text-secondary)]">Webhook:</span>
                          <span className="text-emerald-400 truncate max-w-[150px]" title={p.webhook_url}>{p.webhook_url || "None"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[var(--text-secondary)]">Failover:</span>
                          <span className="text-[var(--text-primary)] truncate max-w-[150px]">{p.webhook_failover_url || "None"}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[var(--text-secondary)] text-sm">No messaging profiles found.</p>
              )}
            </div>
          </div>

          <div className="glass-panel border-none rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-[var(--border-subtle)] bg-[var(--bg-surface-hover)] flex justify-between items-center">
              <h2 className="text-xl font-bold">Call Control Applications (Voice)</h2>
              <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-xs font-bold rounded-full">{callApps.length} Apps</span>
            </div>
            <div className="p-6">
              {callApps.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {callApps.map(a => (
                    <div key={a.id} className="p-4 bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-xl relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
                      <div className="font-bold text-[var(--text-primary)] mb-1 truncate">{a.application_name}</div>
                      <div className="text-xs text-[var(--text-secondary)] font-mono mb-3">{a.id}</div>
                      
                      <div className="text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-[var(--text-secondary)]">Webhook URL:</span>
                          <span className="text-emerald-400 truncate max-w-[150px]" title={a.webhook_event_url}>{a.webhook_event_url || "None"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[var(--text-secondary)]">Outbound Voice:</span>
                          <span className="text-[var(--text-primary)]">{a.outbound_voice_profile_id ? "Linked" : "None"}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[var(--text-secondary)] text-sm">No Call Control Applications found.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'numbers' && (
        <div className="space-y-6">
          <div className="glass-panel border-none rounded-2xl shadow-2xl p-6">
            <h2 className="text-xl font-bold mb-4">Search Global Numbers</h2>
            <div className="flex gap-4 items-end mb-6">
              <div className="flex-1 max-w-xs">
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Country (ISO 2)</label>
                <input 
                  type="text" 
                  value={searchCountry}
                  onChange={(e) => setSearchCountry(e.target.value.toUpperCase())}
                  placeholder="US, FR, GB, CM..."
                  maxLength={2}
                  className="w-full bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded-lg px-4 py-2 text-white font-mono uppercase focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
              <button 
                onClick={handleSearchNumbers}
                disabled={isSearching}
                className="px-6 py-2 bg-[var(--bg-surface-hover)] hover:bg-white/10 text-white rounded-lg font-medium border border-[var(--border-subtle)] transition-colors flex items-center gap-2 h-10"
              >
                {isSearching ? (
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                )}
                Search
              </button>
            </div>
            
            {availableNumbers.length > 0 && (
              <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex flex-col gap-4 md:flex-row md:items-center justify-between">
                <div>
                  <div className="font-bold text-yellow-400 mb-1">Assign to Tenant</div>
                  <p className="text-sm text-[var(--text-secondary)]">Who should own this number in your database?</p>
                </div>
                <select
                  value={selectedOrgId}
                  onChange={(e) => setSelectedOrgId(e.target.value)}
                  className="bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500 w-full md:w-64"
                >
                  <option value="">-- Select an Organization --</option>
                  {organizations.map(org => (
                    <option key={org.id} value={org.id}>{org.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-transparent border-b border-[var(--border-subtle)] text-[var(--text-secondary)]">
                  <tr>
                    <th className="px-4 py-3 font-medium">Phone Number</th>
                    <th className="px-4 py-3 font-medium">Features</th>
                    <th className="px-4 py-3 font-medium">Cost</th>
                    <th className="px-4 py-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {availableNumbers.length === 0 && !isSearching && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-[var(--text-secondary)]">
                        No numbers found. Click Search to find inventory.
                      </td>
                    </tr>
                  )}
                  {availableNumbers.map((num) => (
                    <tr key={num.phone_number} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-lg text-[var(--text-primary)]">
                        {num.phone_number}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {num.features?.map((feat: any, idx: number) => (
                            <span key={idx} className="px-2 py-0.5 bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded text-xs text-[var(--text-secondary)] capitalize">
                              {feat.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">
                        ~{num.cost || "0.50"} $ / mo
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handlePurchase(num.phone_number)}
                          disabled={purchasingNumber === num.phone_number}
                          className="px-4 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-2 ml-auto"
                        >
                          {purchasingNumber === num.phone_number ? (
                            <>
                              <div className="w-3 h-3 rounded-full border-2 border-emerald-400/30 border-t-emerald-400 animate-spin" />
                              Purchasing...
                            </>
                          ) : "Purchase"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'diagnostics' && (
        <div className="space-y-6">
          <div className="glass-panel border-none rounded-2xl shadow-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400"><path d="m21 16-4 4-4-4"/><path d="M17 20V4"/><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/></svg>
                  Global Messaging Logs (Diagnostics)
                </h2>
                <p className="text-sm text-[var(--text-secondary)] mt-1">Live SMS/MMS traffic across all your tenants.</p>
              </div>
              <button 
                onClick={handleRefreshLogs}
                className="px-4 py-2 bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded-lg text-sm font-medium hover:bg-white/5 transition-colors flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                Refresh
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[var(--bg-surface-hover)] border-y border-[var(--border-subtle)] text-[var(--text-secondary)]">
                  <tr>
                    <th className="px-4 py-3 font-medium">Time</th>
                    <th className="px-4 py-3 font-medium">Direction</th>
                    <th className="px-4 py-3 font-medium">From</th>
                    <th className="px-4 py-3 font-medium">To</th>
                    <th className="px-4 py-3 font-medium">Cost</th>
                    <th className="px-4 py-3 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {recentMessages.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-[var(--text-secondary)]">
                        No recent messages found on this account.
                      </td>
                    </tr>
                  ) : (
                    recentMessages.map((msg) => {
                      const isFailed = msg.errors?.length > 0 || msg.status === "failed";
                      const direction = msg.direction === "outbound" ? "Outbound" : "Inbound";
                      
                      return (
                        <tr key={msg.id} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                          <td className="px-4 py-3 text-[var(--text-secondary)] text-xs">
                            {new Date(msg.created_at).toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${direction === 'Outbound' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                              {direction}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-[var(--text-primary)]">
                            {msg.from?.phone_number || "Unknown"}
                          </td>
                          <td className="px-4 py-3 font-mono text-[var(--text-primary)]">
                            {msg.to?.[0]?.phone_number || "Unknown"}
                          </td>
                          <td className="px-4 py-3 text-[var(--text-secondary)] text-xs">
                            {msg.cost?.amount ? `${msg.cost.amount} ${msg.cost.currency}` : "-"}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {isFailed ? (
                              <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-red-500/10 text-red-400 border border-red-500/30 rounded text-xs font-bold" title={msg.errors?.[0]?.detail || "Unknown error"}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                                Failed
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded text-xs font-bold">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                                {msg.status || "Delivered"}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
