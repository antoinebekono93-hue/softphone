"use client";

import { useState, useMemo } from "react";
import { Loader2, MessageSquare, MapPin, DollarSign, Activity, BarChart2, Plus, X, Users, Send } from "lucide-react";
import { useRouter } from "next/navigation";

type SmsMessage = {
  id: string;
  telnyxMessageId: string;
  direction: string;
  body: string;
  status: 'DELIVERED' | 'UNDELIVERED' | 'IN_FLIGHT';
  type: 'SMS' | 'MMS';
  cost: number;
  country: string | null;
  fromNumber: string;
  toNumber: string;
  sentAt: string;
};

type Stats = {
  totalMessages: number;
  totalCost: number;
  deliverabilityRate: number;
  countries: { country: string, count: number, cost: number }[];
};

type Contact = {
  id: string;
  name: string | null;
  phone: string;
};

export default function SmsDashboardClient({ 
  initialMessages, 
  initialStats, 
  contacts
}: { 
  initialMessages: SmsMessage[]; 
  initialStats: Stats;
  contacts: Contact[];
}) {
  const [messages] = useState<SmsMessage[]>(initialMessages);
  const [stats] = useState<Stats>(initialStats);
  
  // Filters
  const [period, setPeriod] = useState("all");
  const [type, setType] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  
  // Campaign Modal
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [campaignMessage, setCampaignMessage] = useState("");
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const router = useRouter();

  const filteredMessages = useMemo(() => {
    return messages.filter(msg => {
      if (type !== 'ALL' && msg.type !== type) return false;
      if (statusFilter !== 'ALL' && msg.status !== statusFilter) return false;
      return true;
    });
  }, [messages, type, statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED': return <span className="px-2.5 py-1 text-xs font-bold rounded-md badge-glass-green">Livré</span>;
      case 'UNDELIVERED': return <span className="px-2.5 py-1 text-xs font-bold rounded-md badge-glass-red">Échoué</span>;
      case 'IN_FLIGHT': return <span className="px-2.5 py-1 text-xs font-bold rounded-md badge-glass-blue">En cours</span>;
      default: return <span className="px-2.5 py-1 text-xs font-bold rounded-md badge-glass-gray">{status}</span>;
    }
  };

  const handleSendCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedContacts.length === 0 || !campaignMessage) return;

    setIsSending(true);
    try {
      const res = await fetch("/api/sms/campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: campaignMessage,
          contactIds: selectedContacts
        })
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Une erreur est survenue");
        return;
      }

      alert("Campagne envoyée avec succès !");
      setIsCampaignModalOpen(false);
      setCampaignMessage("");
      setSelectedContacts([]);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Erreur réseau.");
    } finally {
      setIsSending(false);
    }
  };

  const toggleAllContacts = () => {
    if (selectedContacts.length === contacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(contacts.map(c => c.id));
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto relative">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight mb-2 text-[var(--text-primary)]">
            Campagnes <span className="text-gradient">SMS</span>
          </h1>
          <p className="text-[var(--text-secondary)] text-sm md:text-base">Gérez vos envois groupés, suivez la délivrabilité et analysez les coûts.</p>
        </div>
        <button 
          onClick={() => setIsCampaignModalOpen(true)}
          className="w-full md:w-auto btn-primary-gradient px-6 py-3"
        >
          <Plus className="w-5 h-5" />
          Nouvelle Campagne
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-8">
        <div className="glass-panel p-6 flex items-start justify-between">
          <div>
            <div className="text-[var(--text-secondary)] text-xs font-bold uppercase tracking-wider mb-2">Total Messages</div>
            <div className="text-3xl md:text-4xl font-bold text-[var(--text-primary)]">{stats.totalMessages}</div>
          </div>
          <div className="p-3 bg-[var(--bg-surface-hover)] rounded-xl border border-[var(--border-subtle)] text-[var(--text-secondary)] shadow-sm"><MessageSquare className="w-6 h-6" /></div>
        </div>
        
        <div className="glass-panel p-6 flex items-start justify-between relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/20 blur-2xl rounded-full"></div>
          <div className="relative z-10">
            <div className="text-[var(--text-secondary)] text-xs font-bold uppercase tracking-wider mb-2">Délivrabilité</div>
            <div className="text-3xl md:text-4xl font-bold text-emerald-500">{stats.deliverabilityRate.toFixed(1)}%</div>
          </div>
          <div className="relative z-10 p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-500 shadow-sm"><Activity className="w-6 h-6" /></div>
        </div>

        <div className="glass-panel p-6 flex items-start justify-between">
          <div>
            <div className="text-[var(--text-secondary)] text-xs font-bold uppercase tracking-wider mb-2">Coût Total (Wallet)</div>
            <div className="text-3xl md:text-4xl font-bold text-[var(--text-primary)]">${stats.totalCost.toFixed(2)}</div>
          </div>
          <div className="p-3 bg-[var(--bg-surface-hover)] rounded-xl border border-[var(--border-subtle)] text-[var(--text-secondary)] shadow-sm"><DollarSign className="w-6 h-6" /></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        {/* Analyse Géographique */}
        <div className="lg:col-span-1 glass-panel p-6 flex flex-col">
          <h3 className="font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-cyan-500" /> Dépenses par Pays
          </h3>
          <div className="space-y-5 flex-1">
            {stats.countries.slice(0, 5).map(c => (
              <div key={c.country}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-[var(--text-secondary)]">{c.country}</span>
                  <span className="text-[var(--text-secondary)] font-mono">${c.cost.toFixed(2)}</span>
                </div>
                <div className="w-full bg-[var(--bg-surface-hover)] rounded-full h-1.5 shadow-inner">
                  <div className="bg-gradient-to-r from-cyan-400 to-violet-500 h-1.5 rounded-full shadow-[0_0_10px_rgba(0,212,255,0.5)]" style={{ width: `${(c.cost / (stats.totalCost || 1)) * 100}%` }}></div>
                </div>
              </div>
            ))}
            {stats.countries.length === 0 && <p className="text-sm text-[var(--text-secondary)] text-center mt-8">Aucune donnée géographique</p>}
          </div>
        </div>

        {/* Logs Table */}
        <div className="lg:col-span-3 glass-panel flex flex-col overflow-hidden">
          {/* Actionable Filters */}
          <div className="p-4 border-b border-[var(--border-subtle)] flex flex-wrap gap-3 items-center bg-[var(--bg-surface-solid)]/30">
            <div className="flex items-center gap-2 hidden sm:flex">
              <BarChart2 className="w-4 h-4 text-[var(--text-secondary)]" />
              <span className="text-sm font-semibold text-[var(--text-secondary)]">Filtres :</span>
            </div>
            
            <select 
              value={period} onChange={(e) => setPeriod(e.target.value)}
              className="flex-1 sm:flex-none text-sm px-3 py-2"
            >
              <option value="7d">7 derniers jours</option>
              <option value="30d">30 derniers jours</option>
              <option value="all">Historique complet</option>
            </select>

            <select 
              value={type} onChange={(e) => setType(e.target.value)}
              className="flex-1 sm:flex-none text-sm px-3 py-2"
            >
              <option value="ALL">Tous types</option>
              <option value="SMS">SMS</option>
              <option value="MMS">MMS</option>
            </select>

            <select 
              value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 sm:flex-none text-sm px-3 py-2"
            >
              <option value="ALL">Tous statuts</option>
              <option value="DELIVERED">Livré</option>
              <option value="IN_FLIGHT">En cours</option>
              <option value="UNDELIVERED">Échoué</option>
            </select>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr>
                  <th className="px-6 py-4">Destinataire</th>
                  <th className="px-6 py-4">Message</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Statut</th>
                  <th className="px-6 py-4 text-right">Coût</th>
                </tr>
              </thead>
              <tbody>
                {filteredMessages.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-[var(--text-secondary)]">
                      Aucun message trouvé pour ces critères.
                    </td>
                  </tr>
                ) : filteredMessages.map((msg) => (
                  <tr key={msg.id}>
                    <td className="px-6 py-4">
                      <div className="font-medium text-[var(--text-primary)]">{msg.toNumber}</div>
                      <div className="text-xs text-[var(--text-secondary)] mt-0.5">{msg.country}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] px-2 py-0.5 rounded">{msg.type}</span>
                        <span className="text-[var(--text-primary)] truncate max-w-[200px] md:max-w-[300px]" title={msg.body}>{msg.body}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[var(--text-secondary)] text-xs font-mono">
                      {new Date(msg.sentAt).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(msg.status)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-cyan-500 font-medium">
                      ${msg.cost.toFixed(3)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Campaign Modal */}
      {isCampaignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCampaignModalOpen(false)}></div>
          <div className="relative w-full max-w-2xl bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden animate-slideUp flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-[var(--border-subtle)] flex justify-between items-center bg-[var(--bg-base)]">
              <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-cyan-400" /> Nouvelle Campagne SMS
              </h2>
              <button onClick={() => setIsCampaignModalOpen(false)} className="text-[var(--text-secondary)] hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendCampaign} className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
              <div className="p-6 space-y-6 flex-1">
                
                {/* Destinataires */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                      Destinataires ({selectedContacts.length}/{contacts.length})
                    </label>
                    <button 
                      type="button" 
                      onClick={toggleAllContacts}
                      className="text-xs text-cyan-400 hover:underline"
                    >
                      {selectedContacts.length === contacts.length ? "Tout désélectionner" : "Sélectionner tout"}
                    </button>
                  </div>
                  <div className="bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded-xl p-3 max-h-48 overflow-y-auto custom-scrollbar space-y-2">
                    {contacts.length === 0 ? (
                      <p className="text-sm text-[var(--text-secondary)] text-center py-4">Aucun contact disponible. Ajoutez-en via le CRM.</p>
                    ) : (
                      contacts.map(c => (
                        <label key={c.id} className="flex items-center gap-3 p-2 hover:bg-[var(--bg-surface-solid)] rounded-lg cursor-pointer transition-colors">
                          <input 
                            type="checkbox" 
                            checked={selectedContacts.includes(c.id)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedContacts([...selectedContacts, c.id]);
                              else setSelectedContacts(selectedContacts.filter(id => id !== c.id));
                            }}
                            className="w-4 h-4 rounded border-[var(--border-subtle)] text-cyan-500 focus:ring-cyan-500/20 bg-transparent"
                          />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-[var(--text-primary)]">{c.name || c.phone}</span>
                            {c.name && <span className="text-xs text-[var(--text-secondary)]">{c.phone}</span>}
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                      Message
                    </label>
                    <span className={`text-xs ${campaignMessage.length > 160 ? 'text-amber-500' : 'text-[var(--text-secondary)]'}`}>
                      {campaignMessage.length} caractères {Math.ceil(campaignMessage.length / 160) > 1 && `(${Math.ceil(campaignMessage.length / 160)} SMS)`}
                    </span>
                  </div>
                  <textarea 
                    required
                    value={campaignMessage}
                    onChange={(e) => setCampaignMessage(e.target.value)}
                    placeholder="Bonjour, découvrez notre nouvelle offre !"
                    className="w-full px-4 py-3 min-h-[120px] bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded-xl text-sm focus:border-cyan-500 transition-colors text-[var(--text-primary)] outline-none custom-scrollbar"
                  />
                </div>

                {/* Estimation */}
                {selectedContacts.length > 0 && campaignMessage.length > 0 && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-5 h-5 text-blue-400" />
                      <div>
                        <div className="text-sm font-bold text-[var(--text-primary)]">Coût estimé</div>
                        <div className="text-xs text-[var(--text-secondary)]">{selectedContacts.length} contacts × {Math.ceil(campaignMessage.length / 160)} segment(s) × $0.007</div>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-blue-400">
                      ${(selectedContacts.length * Math.ceil(campaignMessage.length / 160) * 0.007).toFixed(3)}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-[var(--border-subtle)] flex gap-3 justify-end bg-[var(--bg-base)] shrink-0">
                <button 
                  type="button" 
                  onClick={() => setIsCampaignModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-[var(--border-subtle)] text-sm font-medium hover:bg-[var(--bg-surface-hover)] transition-colors text-[var(--text-primary)]"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  disabled={isSending || selectedContacts.length === 0 || campaignMessage.trim() === ''}
                  className="btn-primary-gradient px-6 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                >
                  {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {isSending ? 'Envoi...' : 'Envoyer la Campagne'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
