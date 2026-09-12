"use client";

import { useState, useTransition, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { 
  saveTelnyxApiKey, 
  saveTelnyxPublicKey,
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
  assignOutboundProfileToConnection,
  saveTelnyxVoiceConnection,
  updateCredentialConnection,
  updateCallControlApplication,
  repairApplicationNumberRouting,
  listVoiceUsers,
  setUserVoiceAccess,
  fetchVoiceProductionAudit,
} from "./actions";

export function TelnyxHubClient({ initialSettings }: { initialSettings: any }) {
  const [newApiKey, setNewApiKey] = useState("");
  const [apiKeyConfigured, setApiKeyConfigured] = useState(Boolean(initialSettings?.telnyxApiKeyConfigured));
  const [newPublicKey, setNewPublicKey] = useState("");
  const [publicKeyConfigured, setPublicKeyConfigured] = useState(Boolean(initialSettings?.telnyxPublicKeyConfigured));
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
  const [newProfileDestinations, setNewProfileDestinations] = useState("US,CA,FR,GB,CM");
  const [newProfileMaxRate, setNewProfileMaxRate] = useState("1.00");
  const [newProfileDailyLimit, setNewProfileDailyLimit] = useState("100.00");
  const [newProfileDailyEnabled, setNewProfileDailyEnabled] = useState(true);
  const [editingProfile, setEditingProfile] = useState<any | null>(null);
  const [editingCallApp, setEditingCallApp] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [voiceConnectionId, setVoiceConnectionId] = useState(initialSettings?.telnyxConnectionId || "");
  const [voiceWebhookUrl, setVoiceWebhookUrl] = useState("");
  const [voiceFailoverUrl, setVoiceFailoverUrl] = useState("");
  const [voiceWebhookVersion, setVoiceWebhookVersion] = useState<"1" | "2">("2");
  const [voiceWebhookTimeout, setVoiceWebhookTimeout] = useState("10");
  const [voiceOptions, setVoiceOptions] = useState<any>({
    active: true, connectionName: "", anchor: "Latency", dtmf: "RFC 2833", sipUri: "disabled",
    comfortNoise: true, encodeContact: true, encryptedMedia: "SRTP", noiseSuppression: "both", tags: "",
    inboundChannelLimit: "10", inboundCodecs: "OPUS,G722,PCMU,PCMA", aniFormat: "+E.164", dnisFormat: "+e164",
    generateInboundRingback: true, shakenStir: true, simultaneousRinging: "enabled", prack: true,
    timeout1xx: "10", timeout2xx: "20", outboundChannelLimit: "10", outboundProfileId: "",
    aniOverrideNumber: "", aniOverrideType: "normal", callParking: true, instantRingback: true, generateOutboundRingback: true,
    localization: "US", jitterEnabled: true, jitterMin: "60", jitterMax: "200", rtcpCapture: false,
    rtcpPort: "rtcp-mux", rtcpFrequency: "10", conversationPersistence: false, t38Passthrough: false,
    t38ReinviteSource: "customer", iosPushCredentialId: "", androidPushCredentialId: "",
    inboundRoutingMethod: "sequential", isupHeaders: false, compactSipHeaders: false,
    noiseEngine: "deep_filter_net", noiseAttenuation: "80",
  });
  const [routingMessage, setRoutingMessage] = useState<string | null>(null);
  const [voiceUsers, setVoiceUsers] = useState<any[]>([]);

  // Numbers State
  const [searchCountry, setSearchCountry] = useState("US");
  const [availableNumbers, setAvailableNumbers] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [purchasingNumber, setPurchasingNumber] = useState<string | null>(null);
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");

  // Diagnostics State
  const [recentMessages, setRecentMessages] = useState<any[]>([]);
  const [voiceAudit, setVoiceAudit] = useState<any | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await saveTelnyxApiKey(newApiKey);
      if (result?.error) return setError(result.error);
      setNewApiKey("");
      setApiKeyConfigured(true);
      loadTelnyxData();
    });
  };

  const handleSavePublicKey = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await saveTelnyxPublicKey(newPublicKey);
      if (result?.error) return setError(result.error);
      setNewPublicKey("");
      setPublicKeyConfigured(true);
      setError(null);
    });
  };

  const handleVoiceAudit = async () => {
    setAuditLoading(true);
    setError(null);
    try {
      const result = await fetchVoiceProductionAudit();
      if (result.error) throw new Error(result.error);
      setVoiceAudit(result.data);
    } catch (auditError: any) {
      setError(auditError.message);
    } finally {
      setAuditLoading(false);
    }
  };

  const loadTelnyxData = async () => {
    if (!apiKeyConfigured && !newApiKey) return;
    setLoadingData(true);
    setError(null);
    try {
      const [balRes, msgRes, callRes, logsRes, outProfRes, credConnRes, voiceUsersRes] = await Promise.all([
        fetchTelnyxBalance(),
        fetchMessagingProfiles(),
        fetchCallControlApps(),
        fetchRecentMessages(),
        fetchOutboundProfiles(),
        fetchCredentialConnections(),
        listVoiceUsers(),
      ]);

      if (balRes.error) throw new Error(balRes.error);
      setBalanceData(balRes.data);
      
      if (msgRes.data) setMessagingProfiles(msgRes.data);
      if (callRes.data) setCallApps(callRes.data);
      if (logsRes.data) setRecentMessages(logsRes.data);
      if (outProfRes.data) setOutboundProfiles(outProfRes.data);
      if (credConnRes.data) setCredentialConnections(credConnRes.data);
      if (voiceUsersRes.data) setVoiceUsers(voiceUsersRes.data);

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
      const res = await searchGlobalNumbers(searchCountry);
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
      const res = await purchaseAndAssignNumber(phoneNumber, selectedOrgId);
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
    if (!apiKeyConfigured) return;
    try {
      const logsRes = await fetchRecentMessages();
      if (logsRes.data) setRecentMessages(logsRes.data);
    } catch (e: any) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (initialSettings?.telnyxApiKeyConfigured) {
      loadTelnyxData();
    }
  }, [initialSettings]);

  useEffect(() => {
    const connection = credentialConnections.find((item) => item.id === voiceConnectionId);
    if (!connection) return;
    setVoiceWebhookUrl(connection.webhook_event_url || "");
    setVoiceFailoverUrl(connection.webhook_event_failover_url || "");
    setVoiceWebhookVersion(connection.webhook_api_version === "1" ? "1" : "2");
    setVoiceWebhookTimeout(String(connection.webhook_timeout_secs ?? 10));
    setVoiceOptions({
      active: connection.active !== false,
      connectionName: connection.connection_name || connection.user_name || "",
      anchor: connection.anchorsite_override || "Latency",
      dtmf: connection.dtmf_type || "RFC 2833",
      sipUri: connection.sip_uri_calling_preference || "disabled",
      comfortNoise: Boolean(connection.default_on_hold_comfort_noise_enabled),
      encodeContact: Boolean(connection.encode_contact_header_enabled),
      encryptedMedia: connection.encrypted_media || "none",
      noiseSuppression: typeof connection.noise_suppression === "string" ? connection.noise_suppression : "disabled",
      tags: Array.isArray(connection.tags) ? connection.tags.join(",") : "",
      inboundChannelLimit: String(connection.inbound?.channel_limit ?? 10),
      inboundCodecs: Array.isArray(connection.inbound?.codecs) ? connection.inbound.codecs.join(",") : "OPUS,G722,PCMU,PCMA",
      aniFormat: connection.inbound?.ani_number_format || "+E.164",
      dnisFormat: connection.inbound?.dnis_number_format || "+e164",
      generateInboundRingback: Boolean(connection.inbound?.generate_ringback_tone),
      shakenStir: Boolean(connection.inbound?.shaken_stir_enabled),
      simultaneousRinging: connection.inbound?.simultaneous_ringing || "enabled",
      prack: Boolean(connection.inbound?.prack_enabled),
      timeout1xx: String(connection.inbound?.timeout_1xx_secs ?? 10),
      timeout2xx: String(connection.inbound?.timeout_2xx_secs ?? 20),
      outboundChannelLimit: String(connection.outbound?.channel_limit ?? 10),
      outboundProfileId: connection.outbound?.outbound_voice_profile_id || "",
      aniOverrideNumber: connection.outbound?.ani_override || "",
      aniOverrideType: connection.outbound?.ani_override_type || "normal",
      callParking: Boolean(connection.outbound?.call_parking_enabled),
      instantRingback: Boolean(connection.outbound?.instant_ringback_enabled),
      generateOutboundRingback: Boolean(connection.outbound?.generate_ringback_tone),
      localization: connection.outbound?.localization || "US",
      jitterEnabled: Boolean(connection.jitter_buffer?.enable_jitter_buffer),
      jitterMin: String(connection.jitter_buffer?.jitterbuffer_msec_min ?? 60),
      jitterMax: String(connection.jitter_buffer?.jitterbuffer_msec_max ?? 200),
      rtcpCapture: Boolean(connection.rtcp_settings?.capture_enabled),
      rtcpPort: connection.rtcp_settings?.port || "rtcp-mux",
      rtcpFrequency: String(connection.rtcp_settings?.report_frequency_secs ?? 10),
      conversationPersistence: Boolean(connection.conversation_persistence),
      t38Passthrough: Boolean(connection.onnet_t38_passthrough_enabled),
      t38ReinviteSource: connection.outbound?.t38_reinvite_source || "customer",
      iosPushCredentialId: connection.ios_push_credential_id || "",
      androidPushCredentialId: connection.android_push_credential_id || "",
      inboundRoutingMethod: connection.inbound?.default_routing_method || "sequential",
      isupHeaders: Boolean(connection.inbound?.isup_headers_enabled),
      compactSipHeaders: Boolean(connection.inbound?.sip_compact_headers_enabled),
      noiseEngine: connection.noise_suppression_details?.engine || "deep_filter_net",
      noiseAttenuation: String(connection.noise_suppression_details?.attenuation_limit ?? 80),
    });
  }, [credentialConnections, voiceConnectionId]);

  const saveVoiceRouting = () => {
    if (!voiceConnectionId || !voiceWebhookUrl) {
      setRoutingMessage("Choisissez une connexion et indiquez l'URL webhook primaire.");
      return;
    }
    startTransition(async () => {
      setRoutingMessage(null);
      const connection = await saveTelnyxVoiceConnection(voiceConnectionId);
      if (connection.error) return setRoutingMessage(connection.error);
      const webhook = await updateCredentialConnection(voiceConnectionId, {
        webhook_event_url: voiceWebhookUrl,
        webhook_event_failover_url: voiceFailoverUrl,
        webhook_api_version: voiceWebhookVersion,
        webhook_timeout_secs: Math.min(30, Math.max(0, Number(voiceWebhookTimeout) || 10)),
        active: voiceOptions.active,
        conversation_persistence: voiceOptions.conversationPersistence,
        connection_name: voiceOptions.connectionName,
        anchorsite_override: voiceOptions.anchor,
        dtmf_type: voiceOptions.dtmf,
        sip_uri_calling_preference: voiceOptions.sipUri,
        default_on_hold_comfort_noise_enabled: voiceOptions.comfortNoise,
        encode_contact_header_enabled: voiceOptions.encodeContact,
        onnet_t38_passthrough_enabled: voiceOptions.t38Passthrough,
        ios_push_credential_id: voiceOptions.iosPushCredentialId || null,
        android_push_credential_id: voiceOptions.androidPushCredentialId || null,
        encrypted_media: voiceOptions.encryptedMedia === "SRTP" ? "SRTP" : null,
        noise_suppression: voiceOptions.noiseSuppression,
        noise_suppression_details: { engine: voiceOptions.noiseEngine, attenuation_limit: Number(voiceOptions.noiseAttenuation) },
        tags: String(voiceOptions.tags).split(",").map((item) => item.trim()).filter(Boolean),
        rtcp_settings: { port: voiceOptions.rtcpPort, capture_enabled: voiceOptions.rtcpCapture, report_frequency_secs: Number(voiceOptions.rtcpFrequency) },
        jitter_buffer: {
          enable_jitter_buffer: voiceOptions.jitterEnabled,
          jitterbuffer_msec_min: Number(voiceOptions.jitterMin),
          jitterbuffer_msec_max: Number(voiceOptions.jitterMax),
        },
        inbound: {
          ani_number_format: voiceOptions.aniFormat,
          dnis_number_format: voiceOptions.dnisFormat,
          codecs: String(voiceOptions.inboundCodecs).split(",").map((item) => item.trim().toUpperCase()).filter(Boolean),
          default_routing_method: voiceOptions.inboundRoutingMethod,
          channel_limit: voiceOptions.inboundChannelLimit === "" ? null : Number(voiceOptions.inboundChannelLimit),
          generate_ringback_tone: voiceOptions.generateInboundRingback,
          shaken_stir_enabled: voiceOptions.shakenStir,
          simultaneous_ringing: voiceOptions.simultaneousRinging,
          timeout_1xx_secs: Number(voiceOptions.timeout1xx),
          timeout_2xx_secs: Number(voiceOptions.timeout2xx),
          prack_enabled: voiceOptions.prack,
          isup_headers_enabled: voiceOptions.isupHeaders,
          sip_compact_headers_enabled: voiceOptions.compactSipHeaders,
        },
        outbound: {
          outbound_voice_profile_id: voiceOptions.outboundProfileId || null,
          channel_limit: voiceOptions.outboundChannelLimit === "" ? null : Number(voiceOptions.outboundChannelLimit),
          ani_override: voiceOptions.aniOverrideNumber || null,
          ani_override_type: voiceOptions.aniOverrideType,
          call_parking_enabled: voiceOptions.callParking,
          instant_ringback_enabled: voiceOptions.instantRingback,
          generate_ringback_tone: voiceOptions.generateOutboundRingback,
          localization: voiceOptions.localization,
          t38_reinvite_source: voiceOptions.t38ReinviteSource,
        },
      });
      if (webhook.error) return setRoutingMessage(`Configuration enregistrée localement, mais Telnyx a refusé le webhook : ${webhook.error}`);
      setRoutingMessage("Connexion vocale et webhooks enregistrés.");
      await loadTelnyxData();
    });
  };

  const repairExistingNumbers = () => {
    if (!voiceConnectionId) return setRoutingMessage("Choisissez une connexion vocale avant la synchronisation.");
    startTransition(async () => {
      const result = await repairApplicationNumberRouting(voiceConnectionId);
      if (result.error !== undefined) return setRoutingMessage(result.error);
      setRoutingMessage(`${result.repaired} numéro(s) rattaché(s) à la connexion vocale.${result.failures.length ? ` ${result.failures.length} échec(s).` : ""}`);
    });
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName) return;
    
    startTransition(async () => {
      const res = await createOutboundProfile({
        name: newProfileName,
        concurrent_call_limit: parseInt(newProfileLimit) || 10,
        whitelisted_destinations: newProfileDestinations,
        max_destination_rate: Number(newProfileMaxRate),
        daily_spend_limit: Number(newProfileDailyLimit),
        daily_spend_limit_enabled: newProfileDailyEnabled,
        enabled: true,
        billing_group_id: null,
      });
      if (res.error) {
        alert(res.error);
        return;
      }
      setIsCreatingProfile(false);
      setNewProfileName("");
      await loadTelnyxData();
    });
  };

  const saveEditedProfile = () => {
    if (!editingProfile?.id) return;
    startTransition(async () => {
      const result = await updateOutboundProfile(editingProfile.id, {
        ...editingProfile,
        whitelisted_destinations: Array.isArray(editingProfile.whitelisted_destinations)
          ? editingProfile.whitelisted_destinations
          : String(editingProfile.whitelisted_destinations || "").split(","),
      });
      if (result.error) return setError(result.error);
      setEditingProfile(null);
      await loadTelnyxData();
    });
  };

  const saveEditedCallApp = () => {
    if (!editingCallApp?.id) return;
    startTransition(async () => {
      const result = await updateCallControlApplication(editingCallApp.id, {
        application_name: editingCallApp.application_name,
        webhook_event_url: editingCallApp.webhook_event_url,
        webhook_event_failover_url: editingCallApp.webhook_event_failover_url || "",
        webhook_api_version: editingCallApp.webhook_api_version === "1" ? "1" : "2",
        webhook_timeout_secs: Number(editingCallApp.webhook_timeout_secs ?? 10),
        active: editingCallApp.active !== false,
        anchorsite_override: editingCallApp.anchorsite_override || "Latency",
        dtmf_type: editingCallApp.dtmf_type || "RFC 2833",
        first_command_timeout: Boolean(editingCallApp.first_command_timeout),
        first_command_timeout_secs: Number(editingCallApp.first_command_timeout_secs ?? 10),
        redact_dtmf_debug_logging: editingCallApp.redact_dtmf_debug_logging !== false,
        tags: Array.isArray(editingCallApp.tags) ? editingCallApp.tags : String(editingCallApp.tags || "").split(",").filter(Boolean),
        inbound: {
          channel_limit: editingCallApp.inbound?.channel_limit === "" ? null : Number(editingCallApp.inbound?.channel_limit ?? 10),
          shaken_stir_enabled: editingCallApp.inbound?.shaken_stir_enabled !== false,
          sip_subdomain: editingCallApp.inbound?.sip_subdomain || undefined,
          sip_subdomain_receive_settings: editingCallApp.inbound?.sip_subdomain_receive_settings || "only_my_connections",
        },
        outbound: {
          channel_limit: editingCallApp.outbound?.channel_limit === "" ? null : Number(editingCallApp.outbound?.channel_limit ?? 10),
          outbound_voice_profile_id: editingCallApp.outbound?.outbound_voice_profile_id || null,
        },
      });
      if (result.error) return setRoutingMessage(result.error);
      setEditingCallApp(null);
      await loadTelnyxData();
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
          onClick={() => setActiveTab('credentials')}
          className={`px-4 py-2 font-medium text-sm rounded-lg transition-colors whitespace-nowrap ${activeTab === 'credentials' ? 'bg-[var(--bg-surface-hover)] text-white' : 'text-[var(--text-secondary)] hover:text-white'}`}
        >
          Utilisateurs WebRTC
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
          <Card className="border-none shadow-2xl p-6">
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
                    value={newApiKey}
                    onChange={(e) => setNewApiKey(e.target.value)}
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
            <div className="my-6 border-t border-[var(--border-subtle)]" />
            <form onSubmit={handleSavePublicKey} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  Clé publique Ed25519 des webhooks
                </label>
                <input
                  type="password"
                  value={newPublicKey}
                  onChange={(event) => setNewPublicKey(event.target.value)}
                  placeholder={publicKeyConfigured ? "Configurée — saisir pour remplacer" : "Copiez la clé publique Telnyx"}
                  className="w-full bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded-lg px-4 py-3 text-white font-mono focus:outline-none focus:border-cyan-500"
                />
                <p className="mt-2 text-xs text-[var(--text-secondary)]">
                  Cette clé authentifie chaque événement entrant avant tout routage ou facturation.
                </p>
              </div>
              <button type="submit" disabled={isPending || !newPublicKey.trim()} className="px-4 py-2 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10 rounded-lg text-sm font-semibold disabled:opacity-50">
                Enregistrer la clé publique
              </button>
            </form>
          </Card>

          <Card className="border-none shadow-2xl p-6">
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
          </Card>
        </div>
      )}

      {activeTab === 'outbound' && (
        <div className="space-y-6">
          <Card className="border-none shadow-2xl p-6">
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
                  <div>
                    <label className="block text-sm text-[var(--text-secondary)] mb-1">Destinations autorisées (ISO2)</label>
                    <input value={newProfileDestinations} onChange={(e) => setNewProfileDestinations(e.target.value)} className="w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded px-3 py-2" placeholder="US,CA,FR,GB,CM" />
                  </div>
                  <div>
                    <label className="block text-sm text-[var(--text-secondary)] mb-1">Tarif Telnyx maximal / min</label>
                    <input type="number" min="0" step="0.0001" value={newProfileMaxRate} onChange={(e) => setNewProfileMaxRate(e.target.value)} className="w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm text-[var(--text-secondary)] mb-1">Plafond journalier USD</label>
                    <input type="number" min="0" step="0.01" value={newProfileDailyLimit} onChange={(e) => setNewProfileDailyLimit(e.target.value)} className="w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded px-3 py-2" />
                  </div>
                  <label className="flex items-center gap-2 text-sm self-end pb-2">
                    <input type="checkbox" checked={newProfileDailyEnabled} onChange={(e) => setNewProfileDailyEnabled(e.target.checked)} />
                    Appliquer le plafond journalier
                  </label>
                </div>
                <button type="submit" disabled={isPending} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-sm font-bold disabled:opacity-50 flex items-center gap-2">
                  {isPending && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  Create
                </button>
              </form>
            )}

            {editingProfile && (
              <div className="mb-6 p-4 bg-cyan-500/5 border border-cyan-500/30 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold">Modifier {editingProfile.name}</h3>
                  <button onClick={() => setEditingProfile(null)} className="text-xs text-[var(--text-secondary)]">Fermer</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className="text-sm text-[var(--text-secondary)]">Nom<input value={editingProfile.name || ""} onChange={(e) => setEditingProfile({ ...editingProfile, name: e.target.value })} className="mt-1 w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded px-3 py-2" /></label>
                  <label className="text-sm text-[var(--text-secondary)]">Canaux simultanés<input type="number" min="1" value={editingProfile.concurrent_call_limit ?? ""} onChange={(e) => setEditingProfile({ ...editingProfile, concurrent_call_limit: e.target.value })} className="mt-1 w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded px-3 py-2" /></label>
                  <label className="text-sm text-[var(--text-secondary)]">Destinations ISO2<input value={Array.isArray(editingProfile.whitelisted_destinations) ? editingProfile.whitelisted_destinations.join(",") : editingProfile.whitelisted_destinations || ""} onChange={(e) => setEditingProfile({ ...editingProfile, whitelisted_destinations: e.target.value })} className="mt-1 w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded px-3 py-2" /></label>
                  <label className="text-sm text-[var(--text-secondary)]">Tarif maximal<input type="number" min="0" step="0.0001" value={editingProfile.max_destination_rate ?? 0} onChange={(e) => setEditingProfile({ ...editingProfile, max_destination_rate: e.target.value })} className="mt-1 w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded px-3 py-2" /></label>
                  <label className="text-sm text-[var(--text-secondary)]">Plafond journalier<input type="number" min="0" step="0.01" value={editingProfile.daily_spend_limit ?? 0} onChange={(e) => setEditingProfile({ ...editingProfile, daily_spend_limit: e.target.value })} className="mt-1 w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded px-3 py-2" /></label>
                  <div className="space-y-2 pt-5 text-sm"><label className="flex items-center gap-2"><input type="checkbox" checked={editingProfile.enabled !== false} onChange={(e) => setEditingProfile({ ...editingProfile, enabled: e.target.checked })} />Profil actif</label><label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(editingProfile.daily_spend_limit_enabled)} onChange={(e) => setEditingProfile({ ...editingProfile, daily_spend_limit_enabled: e.target.checked })} />Plafond actif</label></div>
                </div>
                <button onClick={saveEditedProfile} disabled={isPending} className="mt-4 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-sm font-bold disabled:opacity-50">Enregistrer chez Telnyx</button>
              </div>
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
                          <button onClick={() => setEditingProfile({ ...prof })} className="text-cyan-500 hover:text-cyan-400 font-medium text-xs">Modifier</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="border-none shadow-2xl p-6">
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
                                await assignOutboundProfileToConnection(conn.id, newProfileId);
                                await loadTelnyxData();
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
          </Card>
        </div>
      )}

      {activeTab === 'routing' && (
        <div className="space-y-6">
          <Card className="border-none shadow-2xl p-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold">Téléphonie WebRTC & routage entrant</h2>
                <p className="text-sm text-[var(--text-secondary)] mt-1">Connexion utilisée par les numéros achetés, le softphone et les événements d'appel.</p>
              </div>
              <button
                onClick={repairExistingNumbers}
                disabled={isPending || !voiceConnectionId}
                className="px-4 py-2 border border-amber-500/40 text-amber-300 hover:bg-amber-500/10 rounded-lg text-sm font-semibold disabled:opacity-50"
              >
                Rattacher les numéros existants
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block text-sm text-[var(--text-secondary)]">
                Connexion SIP / WebRTC active
                <select value={voiceConnectionId} onChange={(e) => setVoiceConnectionId(e.target.value)} className="mt-1 w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[var(--text-primary)]">
                  <option value="">-- Sélectionner une connexion --</option>
                  {credentialConnections.map((connection) => (
                    <option key={connection.id} value={connection.id}>{connection.connection_name || connection.user_name || connection.id}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm text-[var(--text-secondary)]">
                URL webhook primaire
                <input value={voiceWebhookUrl} onChange={(e) => setVoiceWebhookUrl(e.target.value)} placeholder="https://votre-domaine/api/webhooks/telecom" className="mt-1 w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[var(--text-primary)]" />
              </label>
              <label className="block text-sm text-[var(--text-secondary)]">
                URL webhook de secours <span className="opacity-60">(optionnelle)</span>
                <input value={voiceFailoverUrl} onChange={(e) => setVoiceFailoverUrl(e.target.value)} placeholder="https://.../api/webhooks/telecom" className="mt-1 w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[var(--text-primary)]" />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="block text-sm text-[var(--text-secondary)]">
                  Version webhook
                  <select value={voiceWebhookVersion} onChange={(e) => setVoiceWebhookVersion(e.target.value as "1" | "2")} className="mt-1 w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[var(--text-primary)]"><option value="2">v2</option><option value="1">v1</option></select>
                </label>
                <label className="block text-sm text-[var(--text-secondary)]">
                  Délai (0–30 s)
                  <input type="number" min="0" max="30" value={voiceWebhookTimeout} onChange={(e) => setVoiceWebhookTimeout(e.target.value)} className="mt-1 w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[var(--text-primary)]" />
                </label>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-5">
              <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-hover)] space-y-3">
                <h3 className="font-bold">Connexion et média</h3>
                <label className="block text-xs text-[var(--text-secondary)]">Nom<input value={voiceOptions.connectionName} onChange={(e) => setVoiceOptions({ ...voiceOptions, connectionName: e.target.value })} className="mt-1 w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded px-3 py-2" /></label>
                <label className="block text-xs text-[var(--text-secondary)]">Anchor site<select value={voiceOptions.anchor} onChange={(e) => setVoiceOptions({ ...voiceOptions, anchor: e.target.value })} className="mt-1 w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded px-3 py-2"><option>Latency</option><option>Frankfurt, Germany</option><option>Amsterdam, Netherlands</option><option>London, UK</option><option>Ashburn, VA</option><option>Chicago, IL</option><option>San Jose, CA</option><option>Toronto, Canada</option><option>Vancouver, Canada</option><option>Sydney, Australia</option></select></label>
                <div className="grid grid-cols-2 gap-2"><label className="block text-xs text-[var(--text-secondary)]">DTMF<select value={voiceOptions.dtmf} onChange={(e) => setVoiceOptions({ ...voiceOptions, dtmf: e.target.value })} className="mt-1 w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded px-2 py-2"><option>RFC 2833</option><option>Inband</option><option>SIP INFO</option></select></label><label className="block text-xs text-[var(--text-secondary)]">SIP URI<select value={voiceOptions.sipUri} onChange={(e) => setVoiceOptions({ ...voiceOptions, sipUri: e.target.value })} className="mt-1 w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded px-2 py-2"><option value="disabled">Désactivé</option><option value="internal">Interne</option><option value="unrestricted">Public</option></select></label></div>
                <label className="block text-xs text-[var(--text-secondary)]">Suppression du bruit<select value={voiceOptions.noiseSuppression} onChange={(e) => setVoiceOptions({ ...voiceOptions, noiseSuppression: e.target.value })} className="mt-1 w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded px-3 py-2"><option value="disabled">Désactivée</option><option value="inbound">Entrant</option><option value="outbound">Sortant</option><option value="both">Deux sens</option></select></label>
                <label className="block text-xs text-[var(--text-secondary)]">Atténuation du bruit (0–100)<input type="number" min="0" max="100" value={voiceOptions.noiseAttenuation} onChange={(e) => setVoiceOptions({ ...voiceOptions, noiseAttenuation: e.target.value })} className="mt-1 w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded px-3 py-2" /></label>
                <label className="block text-xs text-[var(--text-secondary)]">Tags<input value={voiceOptions.tags} onChange={(e) => setVoiceOptions({ ...voiceOptions, tags: e.target.value })} placeholder="production,webrtc" className="mt-1 w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded px-3 py-2" /></label>
                <div className="grid grid-cols-2 gap-2"><label className="block text-xs text-[var(--text-secondary)]">Jitter min ms<input type="number" value={voiceOptions.jitterMin} onChange={(e) => setVoiceOptions({ ...voiceOptions, jitterMin: e.target.value })} className="mt-1 w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded px-2 py-2" /></label><label className="block text-xs text-[var(--text-secondary)]">Jitter max ms<input type="number" value={voiceOptions.jitterMax} onChange={(e) => setVoiceOptions({ ...voiceOptions, jitterMax: e.target.value })} className="mt-1 w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded px-2 py-2" /></label></div>
                <div className="grid grid-cols-2 gap-2"><label className="block text-xs text-[var(--text-secondary)]">Port RTCP<select value={voiceOptions.rtcpPort} onChange={(e) => setVoiceOptions({ ...voiceOptions, rtcpPort: e.target.value })} className="mt-1 w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded px-2 py-2"><option value="rtcp-mux">RTCP mux</option><option value="rtp+1">RTP + 1</option></select></label><label className="block text-xs text-[var(--text-secondary)]">Rapport RTCP (s)<input type="number" min="1" max="60" value={voiceOptions.rtcpFrequency} onChange={(e) => setVoiceOptions({ ...voiceOptions, rtcpFrequency: e.target.value })} className="mt-1 w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded px-2 py-2" /></label></div>
                <label className="block text-xs text-[var(--text-secondary)]">Credential push iOS<input value={voiceOptions.iosPushCredentialId} onChange={(e) => setVoiceOptions({ ...voiceOptions, iosPushCredentialId: e.target.value })} className="mt-1 w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded px-3 py-2" /></label>
                <label className="block text-xs text-[var(--text-secondary)]">Credential push Android<input value={voiceOptions.androidPushCredentialId} onChange={(e) => setVoiceOptions({ ...voiceOptions, androidPushCredentialId: e.target.value })} className="mt-1 w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded px-3 py-2" /></label>
                <div className="grid grid-cols-2 gap-2 text-xs"><label><input type="checkbox" checked={voiceOptions.active} onChange={(e) => setVoiceOptions({ ...voiceOptions, active: e.target.checked })} /> Active</label><label><input type="checkbox" checked={voiceOptions.encryptedMedia === "SRTP"} onChange={(e) => setVoiceOptions({ ...voiceOptions, encryptedMedia: e.target.checked ? "SRTP" : "none" })} /> SRTP</label><label><input type="checkbox" checked={voiceOptions.comfortNoise} onChange={(e) => setVoiceOptions({ ...voiceOptions, comfortNoise: e.target.checked })} /> Bruit de confort</label><label><input type="checkbox" checked={voiceOptions.encodeContact} onChange={(e) => setVoiceOptions({ ...voiceOptions, encodeContact: e.target.checked })} /> Contact NAT</label><label><input type="checkbox" checked={voiceOptions.jitterEnabled} onChange={(e) => setVoiceOptions({ ...voiceOptions, jitterEnabled: e.target.checked })} /> Jitter buffer</label><label><input type="checkbox" checked={voiceOptions.rtcpCapture} onChange={(e) => setVoiceOptions({ ...voiceOptions, rtcpCapture: e.target.checked })} /> Capture RTCP</label><label><input type="checkbox" checked={voiceOptions.conversationPersistence} onChange={(e) => setVoiceOptions({ ...voiceOptions, conversationPersistence: e.target.checked })} /> Persistance conversation</label><label><input type="checkbox" checked={voiceOptions.t38Passthrough} onChange={(e) => setVoiceOptions({ ...voiceOptions, t38Passthrough: e.target.checked })} /> T.38 on-net</label></div>
              </div>

              <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-hover)] space-y-3">
                <h3 className="font-bold">Appels entrants</h3>
                <label className="block text-xs text-[var(--text-secondary)]">Codecs préférés<input value={voiceOptions.inboundCodecs} onChange={(e) => setVoiceOptions({ ...voiceOptions, inboundCodecs: e.target.value })} className="mt-1 w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded px-3 py-2" /></label>
                <div className="grid grid-cols-2 gap-2"><label className="block text-xs text-[var(--text-secondary)]">Canaux<input type="number" min="1" value={voiceOptions.inboundChannelLimit} onChange={(e) => setVoiceOptions({ ...voiceOptions, inboundChannelLimit: e.target.value })} className="mt-1 w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded px-2 py-2" /></label><label className="block text-xs text-[var(--text-secondary)]">Sonnerie<select value={voiceOptions.simultaneousRinging} onChange={(e) => setVoiceOptions({ ...voiceOptions, simultaneousRinging: e.target.value })} className="mt-1 w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded px-2 py-2"><option value="enabled">Simultanée</option><option value="disabled">Désactivée</option></select></label></div>
                <label className="block text-xs text-[var(--text-secondary)]">Méthode de routage<select value={voiceOptions.inboundRoutingMethod} onChange={(e) => setVoiceOptions({ ...voiceOptions, inboundRoutingMethod: e.target.value })} className="mt-1 w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded px-3 py-2"><option value="sequential">Séquentielle</option><option value="round-robin">Round robin</option></select></label>
                <div className="grid grid-cols-2 gap-2"><label className="block text-xs text-[var(--text-secondary)]">Format ANI<input value={voiceOptions.aniFormat} onChange={(e) => setVoiceOptions({ ...voiceOptions, aniFormat: e.target.value })} className="mt-1 w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded px-2 py-2" /></label><label className="block text-xs text-[var(--text-secondary)]">Format DNIS<input value={voiceOptions.dnisFormat} onChange={(e) => setVoiceOptions({ ...voiceOptions, dnisFormat: e.target.value })} className="mt-1 w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded px-2 py-2" /></label></div>
                <div className="grid grid-cols-2 gap-2"><label className="block text-xs text-[var(--text-secondary)]">Timeout 1xx<input type="number" value={voiceOptions.timeout1xx} onChange={(e) => setVoiceOptions({ ...voiceOptions, timeout1xx: e.target.value })} className="mt-1 w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded px-2 py-2" /></label><label className="block text-xs text-[var(--text-secondary)]">Timeout 2xx<input type="number" value={voiceOptions.timeout2xx} onChange={(e) => setVoiceOptions({ ...voiceOptions, timeout2xx: e.target.value })} className="mt-1 w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded px-2 py-2" /></label></div>
                <div className="space-y-2 text-xs"><label className="block"><input type="checkbox" checked={voiceOptions.shakenStir} onChange={(e) => setVoiceOptions({ ...voiceOptions, shakenStir: e.target.checked })} /> En-têtes SHAKEN/STIR</label><label className="block"><input type="checkbox" checked={voiceOptions.generateInboundRingback} onChange={(e) => setVoiceOptions({ ...voiceOptions, generateInboundRingback: e.target.checked })} /> Générer la tonalité</label><label className="block"><input type="checkbox" checked={voiceOptions.prack} onChange={(e) => setVoiceOptions({ ...voiceOptions, prack: e.target.checked })} /> PRACK</label><label className="block"><input type="checkbox" checked={voiceOptions.isupHeaders} onChange={(e) => setVoiceOptions({ ...voiceOptions, isupHeaders: e.target.checked })} /> En-têtes ISUP</label><label className="block"><input type="checkbox" checked={voiceOptions.compactSipHeaders} onChange={(e) => setVoiceOptions({ ...voiceOptions, compactSipHeaders: e.target.checked })} /> En-têtes SIP compacts</label></div>
              </div>

              <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-hover)] space-y-3">
                <h3 className="font-bold">Appels sortants</h3>
                <label className="block text-xs text-[var(--text-secondary)]">Profil sortant<select value={voiceOptions.outboundProfileId} onChange={(e) => setVoiceOptions({ ...voiceOptions, outboundProfileId: e.target.value })} className="mt-1 w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded px-3 py-2"><option value="">Aucun</option>{outboundProfiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}</select></label>
                <div className="grid grid-cols-2 gap-2"><label className="block text-xs text-[var(--text-secondary)]">Canaux<input type="number" min="1" value={voiceOptions.outboundChannelLimit} onChange={(e) => setVoiceOptions({ ...voiceOptions, outboundChannelLimit: e.target.value })} className="mt-1 w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded px-2 py-2" /></label><label className="block text-xs text-[var(--text-secondary)]">Localisation<input maxLength={2} value={voiceOptions.localization} onChange={(e) => setVoiceOptions({ ...voiceOptions, localization: e.target.value.toUpperCase() })} className="mt-1 w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded px-2 py-2" /></label></div>
                <label className="block text-xs text-[var(--text-secondary)]">Numéro Caller ID forcé (E.164)<input value={voiceOptions.aniOverrideNumber} onChange={(e) => setVoiceOptions({ ...voiceOptions, aniOverrideNumber: e.target.value })} placeholder="+12025550123" className="mt-1 w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded px-3 py-2" /></label>
                <label className="block text-xs text-[var(--text-secondary)]">Politique Caller ID<select value={voiceOptions.aniOverrideType} onChange={(e) => setVoiceOptions({ ...voiceOptions, aniOverrideType: e.target.value })} className="mt-1 w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded px-3 py-2"><option value="normal">Normale</option><option value="always">Toujours remplacer</option><option value="never">Ne jamais remplacer</option></select></label>
                <label className="block text-xs text-[var(--text-secondary)]">Source réinvite T.38<select value={voiceOptions.t38ReinviteSource} onChange={(e) => setVoiceOptions({ ...voiceOptions, t38ReinviteSource: e.target.value })} className="mt-1 w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded px-3 py-2"><option value="customer">Client</option><option value="telnyx">Telnyx</option></select></label>
                <div className="space-y-2 text-xs"><label className="block"><input type="checkbox" checked={voiceOptions.callParking} onChange={(e) => setVoiceOptions({ ...voiceOptions, callParking: e.target.checked })} /> Parking Call Control</label><label className="block"><input type="checkbox" checked={voiceOptions.instantRingback} onChange={(e) => setVoiceOptions({ ...voiceOptions, instantRingback: e.target.checked })} /> Ringback instantané</label><label className="block"><input type="checkbox" checked={voiceOptions.generateOutboundRingback} onChange={(e) => setVoiceOptions({ ...voiceOptions, generateOutboundRingback: e.target.checked })} /> Générer la tonalité</label></div>
                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-300">Le coût d’appel dans les webhooks reste toujours activé pour protéger la facturation.</div>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-4">
              <button onClick={saveVoiceRouting} disabled={isPending} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg disabled:opacity-50">Enregistrer le routage vocal</button>
              {routingMessage && <span className="text-sm text-[var(--text-secondary)]">{routingMessage}</span>}
            </div>
          </Card>

          <Card className="border-none shadow-2xl overflow-hidden">
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
          </Card>

          <Card className="border-none shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-[var(--border-subtle)] bg-[var(--bg-surface-hover)] flex justify-between items-center">
              <h2 className="text-xl font-bold">Call Control Applications (Voice)</h2>
              <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-xs font-bold rounded-full">{callApps.length} Apps</span>
            </div>
            <div className="p-6">
              {editingCallApp && (
                <div className="mb-6 p-4 rounded-xl border border-purple-500/30 bg-purple-500/5">
                  <div className="flex justify-between items-center mb-4"><h3 className="font-bold">Configuration complète — {editingCallApp.application_name}</h3><button onClick={() => setEditingCallApp(null)} className="text-xs text-[var(--text-secondary)]">Fermer</button></div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <label className="text-xs text-[var(--text-secondary)]">Nom<input value={editingCallApp.application_name || ""} onChange={(e) => setEditingCallApp({ ...editingCallApp, application_name: e.target.value })} className="mt-1 w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded px-3 py-2" /></label>
                    <label className="text-xs text-[var(--text-secondary)]">Webhook primaire<input value={editingCallApp.webhook_event_url || ""} onChange={(e) => setEditingCallApp({ ...editingCallApp, webhook_event_url: e.target.value })} className="mt-1 w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded px-3 py-2" /></label>
                    <label className="text-xs text-[var(--text-secondary)]">Webhook secours<input value={editingCallApp.webhook_event_failover_url || ""} onChange={(e) => setEditingCallApp({ ...editingCallApp, webhook_event_failover_url: e.target.value })} className="mt-1 w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded px-3 py-2" /></label>
                    <label className="text-xs text-[var(--text-secondary)]">Anchor site<select value={editingCallApp.anchorsite_override || "Latency"} onChange={(e) => setEditingCallApp({ ...editingCallApp, anchorsite_override: e.target.value })} className="mt-1 w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded px-3 py-2"><option>Latency</option><option>Amsterdam, Netherlands</option><option>London, UK</option><option>Ashburn, VA</option><option>Chicago, IL</option><option>San Jose, CA</option><option>Toronto, Canada</option><option>Sydney, Australia</option><option>Chennai, IN</option></select></label>
                    <label className="text-xs text-[var(--text-secondary)]">DTMF<select value={editingCallApp.dtmf_type || "RFC 2833"} onChange={(e) => setEditingCallApp({ ...editingCallApp, dtmf_type: e.target.value })} className="mt-1 w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded px-3 py-2"><option>RFC 2833</option><option>Inband</option><option>SIP INFO</option></select></label>
                    <label className="text-xs text-[var(--text-secondary)]">Timeout webhook<input type="number" min="0" max="30" value={editingCallApp.webhook_timeout_secs ?? 10} onChange={(e) => setEditingCallApp({ ...editingCallApp, webhook_timeout_secs: e.target.value })} className="mt-1 w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded px-3 py-2" /></label>
                    <label className="text-xs text-[var(--text-secondary)]">Timeout première commande<input type="number" min="1" max="120" value={editingCallApp.first_command_timeout_secs ?? 10} onChange={(e) => setEditingCallApp({ ...editingCallApp, first_command_timeout_secs: e.target.value })} className="mt-1 w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded px-3 py-2" /></label>
                    <label className="text-xs text-[var(--text-secondary)]">Canaux entrants<input type="number" min="1" value={editingCallApp.inbound?.channel_limit ?? 10} onChange={(e) => setEditingCallApp({ ...editingCallApp, inbound: { ...editingCallApp.inbound, channel_limit: e.target.value } })} className="mt-1 w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded px-3 py-2" /></label>
                    <label className="text-xs text-[var(--text-secondary)]">Canaux sortants<input type="number" min="1" value={editingCallApp.outbound?.channel_limit ?? 10} onChange={(e) => setEditingCallApp({ ...editingCallApp, outbound: { ...editingCallApp.outbound, channel_limit: e.target.value } })} className="mt-1 w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded px-3 py-2" /></label>
                    <label className="text-xs text-[var(--text-secondary)]">Profil sortant<select value={editingCallApp.outbound?.outbound_voice_profile_id || ""} onChange={(e) => setEditingCallApp({ ...editingCallApp, outbound: { ...editingCallApp.outbound, outbound_voice_profile_id: e.target.value } })} className="mt-1 w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded px-3 py-2"><option value="">Aucun</option>{outboundProfiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}</select></label>
                    <label className="text-xs text-[var(--text-secondary)]">Sous-domaine SIP<input value={editingCallApp.inbound?.sip_subdomain || ""} onChange={(e) => setEditingCallApp({ ...editingCallApp, inbound: { ...editingCallApp.inbound, sip_subdomain: e.target.value } })} className="mt-1 w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded px-3 py-2" /></label>
                    <label className="text-xs text-[var(--text-secondary)]">Réception SIP<select value={editingCallApp.inbound?.sip_subdomain_receive_settings || "only_my_connections"} onChange={(e) => setEditingCallApp({ ...editingCallApp, inbound: { ...editingCallApp.inbound, sip_subdomain_receive_settings: e.target.value } })} className="mt-1 w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded px-3 py-2"><option value="only_my_connections">Mes connexions uniquement</option><option value="from_anyone">Internet public</option></select></label>
                    <label className="text-xs text-[var(--text-secondary)]">Tags<input value={Array.isArray(editingCallApp.tags) ? editingCallApp.tags.join(",") : editingCallApp.tags || ""} onChange={(e) => setEditingCallApp({ ...editingCallApp, tags: e.target.value })} className="mt-1 w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded px-3 py-2" /></label>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-4 text-xs"><label><input type="checkbox" checked={editingCallApp.active !== false} onChange={(e) => setEditingCallApp({ ...editingCallApp, active: e.target.checked })} /> Application active</label><label><input type="checkbox" checked={Boolean(editingCallApp.first_command_timeout)} onChange={(e) => setEditingCallApp({ ...editingCallApp, first_command_timeout: e.target.checked })} /> Raccrocher si timeout initial</label><label><input type="checkbox" checked={editingCallApp.redact_dtmf_debug_logging !== false} onChange={(e) => setEditingCallApp({ ...editingCallApp, redact_dtmf_debug_logging: e.target.checked })} /> Masquer DTMF dans les logs</label><label><input type="checkbox" checked={editingCallApp.inbound?.shaken_stir_enabled !== false} onChange={(e) => setEditingCallApp({ ...editingCallApp, inbound: { ...editingCallApp.inbound, shaken_stir_enabled: e.target.checked } })} /> SHAKEN/STIR</label></div>
                  <button onClick={saveEditedCallApp} disabled={isPending} className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded text-sm font-bold disabled:opacity-50">Enregistrer chez Telnyx</button>
                </div>
              )}
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
                      <button
                        disabled={isPending || !voiceWebhookUrl}
                        onClick={() => startTransition(async () => {
                          const result = await updateCallControlApplication(a.id, {
                            application_name: a.application_name,
                            webhook_event_url: voiceWebhookUrl,
                            webhook_event_failover_url: voiceFailoverUrl,
                            webhook_api_version: voiceWebhookVersion,
                            webhook_timeout_secs: Math.min(30, Math.max(0, Number(voiceWebhookTimeout) || 10)),
                            active: a.active !== false,
                          });
                          setRoutingMessage(result.error || `Application ${a.application_name} configurée.`);
                          if (!result.error) await loadTelnyxData();
                        })}
                        className="mt-4 w-full py-2 border border-purple-500/30 text-purple-300 hover:bg-purple-500/10 rounded-lg text-xs font-semibold disabled:opacity-50"
                      >
                        Appliquer ce webhook vocal
                      </button>
                      <button onClick={() => setEditingCallApp({ ...a, inbound: { ...(a.inbound || {}) }, outbound: { ...(a.outbound || {}) } })} className="mt-2 w-full py-2 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 rounded-lg text-xs font-semibold">Modifier tous les réglages</button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[var(--text-secondary)] text-sm">No Call Control Applications found.</p>
              )}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'credentials' && (
        <Card className="border-none shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-[var(--border-subtle)] bg-[var(--bg-surface-hover)]">
            <h2 className="text-xl font-bold">Identités WebRTC par utilisateur</h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1">Chaque utilisateur reçoit son propre credential Telnyx et seulement un JWT temporaire côté navigateur. La clé maître reste sur le serveur.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[var(--border-subtle)] text-[var(--text-secondary)]"><tr><th className="px-5 py-3">Utilisateur</th><th className="px-5 py-3">Organisation</th><th className="px-5 py-3">Accès</th><th className="px-5 py-3">Credential</th><th className="px-5 py-3 text-right">Actions</th></tr></thead>
              <tbody className="divide-y divide-white/5">
                {voiceUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-5 py-4"><div className="font-semibold">{user.name || user.email}</div><div className="text-xs text-[var(--text-secondary)]">{user.email}</div></td>
                    <td className="px-5 py-4">{user.organization?.name || "—"}</td>
                    <td className="px-5 py-4"><span className={user.isCallable ? "text-emerald-400" : "text-red-400"}>{user.isCallable ? "Autorisé" : "Bloqué"}</span></td>
                    <td className="px-5 py-4"><div>{user.credentialStatus}</div><div className="text-[10px] font-mono text-[var(--text-secondary)] max-w-[220px] truncate" title={user.telnyxTelephonyCredentialId || ""}>{user.telnyxTelephonyCredentialId || "Créé à la prochaine connexion"}</div></td>
                    <td className="px-5 py-4 text-right space-x-2">
                      {user.isCallable && user.telnyxTelephonyCredentialId && (
                        <button disabled={isPending} onClick={() => startTransition(async () => { const result = await setUserVoiceAccess(user.id, true); if (result.error) setError(result.error); else await loadTelnyxData(); })} className="px-3 py-1.5 border border-amber-500/30 text-amber-300 rounded text-xs disabled:opacity-50">Révoquer/renouveler</button>
                      )}
                      <button disabled={isPending} onClick={() => startTransition(async () => { const result = await setUserVoiceAccess(user.id, !user.isCallable); if (result.error) setError(result.error); else await loadTelnyxData(); })} className={`px-3 py-1.5 border rounded text-xs disabled:opacity-50 ${user.isCallable ? 'border-red-500/30 text-red-300' : 'border-emerald-500/30 text-emerald-300'}`}>{user.isCallable ? "Bloquer" : "Autoriser"}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'numbers' && (
        <div className="space-y-6">
          <Card className="border-none shadow-2xl p-6">
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
          </Card>
        </div>
      )}

      {activeTab === 'diagnostics' && (
        <div className="space-y-6">
          <Card className="border-none shadow-2xl p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold">Audit téléphonique de production</h2>
                <p className="text-sm text-[var(--text-secondary)] mt-1">Contrôle en direct la connexion, les webhooks, le profil sortant, les notifications et chaque numéro Telnyx.</p>
              </div>
              <button onClick={handleVoiceAudit} disabled={auditLoading || !apiKeyConfigured} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-sm font-semibold disabled:opacity-50">
                {auditLoading ? "Audit en cours…" : "Lancer l’audit réel"}
              </button>
            </div>
            {!voiceAudit ? (
              <p className="text-sm text-[var(--text-secondary)]">L’audit interroge Telnyx sans modifier la configuration.</p>
            ) : (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {voiceAudit.checks.map((check: any) => (
                    <div key={check.key} className={`rounded-xl border p-4 ${check.level === "PASS" ? "border-emerald-500/30 bg-emerald-500/10" : check.level === "WARNING" ? "border-amber-500/30 bg-amber-500/10" : "border-red-500/30 bg-red-500/10"}`}>
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold text-sm">{check.label}</span>
                        <span className={`text-xs font-bold ${check.level === "PASS" ? "text-emerald-400" : check.level === "WARNING" ? "text-amber-300" : "text-red-400"}`}>{check.level === "PASS" ? "OK" : check.level === "WARNING" ? "À améliorer" : "Bloquant"}</span>
                      </div>
                      <p className="mt-2 text-xs text-[var(--text-secondary)] break-words">{check.detail}</p>
                    </div>
                  ))}
                </div>
                {voiceAudit.numbers.some((number: any) => !number.healthy) && (
                  <div>
                    <h3 className="font-semibold mb-2">Numéros à réparer</h3>
                    <div className="space-y-2">
                      {voiceAudit.numbers.filter((number: any) => !number.healthy).map((number: any) => (
                        <div key={number.id} className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs">
                          <span className="font-mono font-semibold">{number.number}</span>
                          <span className="ml-3 text-[var(--text-secondary)]">{number.error || (!number.connectionMatches ? "mauvaise connexion Telnyx" : number.nativeForwardingEnabled ? "transfert Telnyx natif encore actif" : "routage local incomplet")}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {voiceAudit.deliveries.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Dernières livraisons vocales Telnyx</h3>
                    <div className="overflow-x-auto rounded-xl border border-[var(--border-subtle)]">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[var(--bg-surface-hover)] text-[var(--text-secondary)]"><tr><th className="px-3 py-2">Événement</th><th className="px-3 py-2">Date</th><th className="px-3 py-2">HTTP</th><th className="px-3 py-2">État</th></tr></thead>
                        <tbody className="divide-y divide-white/5">
                          {voiceAudit.deliveries.map((delivery: any) => (
                            <tr key={delivery.id}>
                              <td className="px-3 py-2 font-mono">{delivery.eventType}</td>
                              <td className="px-3 py-2 text-[var(--text-secondary)]">{delivery.startedAt ? new Date(delivery.startedAt).toLocaleString() : "—"}</td>
                              <td className="px-3 py-2">{delivery.responseStatus ?? "—"}</td>
                              <td className={`px-3 py-2 font-semibold ${delivery.status === "delivered" ? "text-emerald-400" : "text-red-400"}`}>{delivery.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                <p className="text-xs text-[var(--text-secondary)]">Dernier contrôle : {new Date(voiceAudit.checkedAt).toLocaleString()}</p>
              </div>
            )}
          </Card>
          <Card className="border-none shadow-2xl p-6">
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
          </Card>
        </div>
      )}
    </div>
  );
}
