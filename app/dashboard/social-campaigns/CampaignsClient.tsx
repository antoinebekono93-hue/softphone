"use client";

import { useState } from "react";
import { Megaphone, Users, MessageSquare, Play, CalendarClock, Target } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CampaignsClient({ groups, templates, facebookAccounts, initialCampaigns }: any) {
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [channel, setChannel] = useState("WHATSAPP");
  const [templateId, setTemplateId] = useState("");
  const [socialAccountId, setSocialAccountId] = useState("");
  const [messageText, setMessageText] = useState("");
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [botEnabled, setBotEnabled] = useState(false);
  const [aiGoal, setAiGoal] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const toggleGroup = (id: string) => {
    setSelectedGroups(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (channel === 'WHATSAPP' && !templateId) return alert("Sélectionnez un modèle WhatsApp.");
    if (channel === 'MESSENGER' && (!socialAccountId || !messageText)) return alert("Sélectionnez une Page Facebook et rédigez un message.");
    if (selectedGroups.length === 0) return alert("Sélectionnez au moins un groupe de contacts.");

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/social-campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          channel,
          templateId: channel === 'WHATSAPP' ? templateId : undefined,
          socialAccountId: channel === 'MESSENGER' ? socialAccountId : undefined,
          messageText: channel === 'MESSENGER' ? messageText : undefined,
          groupIds: selectedGroups,
          botEnabled,
          aiGoal
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to launch campaign");
      }

      const data = await res.json();
      setCampaigns([data.campaign, ...campaigns]);
      setIsModalOpen(false);
      setName("");
      setTemplateId("");
      setSocialAccountId("");
      setMessageText("");
      setSelectedGroups([]);
      setBotEnabled(false);
      setAiGoal("");
      router.refresh();
      alert("Campagne lancée avec succès !");
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] flex items-center gap-3">
            <Megaphone className="text-emerald-500" /> Campagnes Sociales
          </h1>
          <p className="text-[var(--text-secondary)] mt-2">Envoyez des messages groupés via WhatsApp ou Facebook Messenger.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary-gradient px-6 py-3 flex items-center gap-2">
          <Play className="w-5 h-5" />
          Lancer une campagne
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
          <div className="p-4 rounded-xl bg-blue-500/10 text-blue-500"><Target className="w-8 h-8" /></div>
          <div><p className="text-[var(--text-secondary)] text-sm">Total Campagnes</p><p className="text-2xl font-bold text-[var(--text-primary)]">{campaigns.length}</p></div>
        </div>
        <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
          <div className="p-4 rounded-xl bg-emerald-500/10 text-emerald-500"><CheckCircle /></div>
          <div><p className="text-[var(--text-secondary)] text-sm">Messages Envoyés</p><p className="text-2xl font-bold text-[var(--text-primary)]">{campaigns.reduce((acc: number, c: any) => acc + (c.sentCount || 0), 0)}</p></div>
        </div>
        <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
          <div className="p-4 rounded-xl bg-amber-500/10 text-amber-500"><CalendarClock className="w-8 h-8" /></div>
          <div><p className="text-[var(--text-secondary)] text-sm">Dernière activité</p><p className="text-xl font-bold text-[var(--text-primary)]">{campaigns[0] ? new Date(campaigns[0].createdAt).toLocaleDateString() : 'Jamais'}</p></div>
        </div>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden border border-[var(--border-subtle)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] text-sm text-[var(--text-secondary)]">
                <th className="p-4 font-semibold">Nom de la campagne</th>
                <th className="p-4 font-semibold">Canal</th>
                <th className="p-4 font-semibold">Statut</th>
                <th className="p-4 font-semibold">Contenu / Modèle</th>
                <th className="p-4 font-semibold">Cibles</th>
                <th className="p-4 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[var(--text-secondary)]">Aucune campagne lancée.</td>
                </tr>
              ) : campaigns.map((campaign: any) => (
                <tr key={campaign.id} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)] transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-[var(--text-primary)]">{campaign.name}</div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs font-bold rounded-md ${campaign.channel === 'WHATSAPP' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                      {campaign.channel}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 text-xs font-bold rounded-md bg-[var(--bg-surface-hover)] text-[var(--text-secondary)]">{campaign.status}</span>
                  </td>
                  <td className="p-4 text-[var(--text-secondary)]">
                    {campaign.channel === 'WHATSAPP' ? campaign.template?.name : (campaign.body?.substring(0, 20) + "...")}
                  </td>
                  <td className="p-4 text-[var(--text-secondary)]">{campaign.sentCount} contacts</td>
                  <td className="p-4 text-[var(--text-secondary)]">{new Date(campaign.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-2xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Lancer une nouvelle campagne</h2>
            <form onSubmit={handleCreateCampaign} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-[var(--text-secondary)] mb-1">Nom de la campagne</label>
                <input 
                  type="text" required value={name} onChange={e => setName(e.target.value)}
                  className="w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:border-emerald-500 outline-none"
                  placeholder="Promo de Printemps"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <button type="button" onClick={() => setChannel("WHATSAPP")} className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${channel === 'WHATSAPP' ? 'border-emerald-500 bg-emerald-500/5' : 'border-[var(--border-subtle)] hover:border-emerald-500/50'}`}>
                  <div className={`p-3 rounded-full ${channel === 'WHATSAPP' ? 'bg-emerald-500 text-white' : 'bg-[var(--bg-surface-hover)] text-[var(--text-secondary)]'}`}>
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <span className="font-bold">WhatsApp</span>
                </button>
                <button type="button" onClick={() => setChannel("MESSENGER")} className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${channel === 'MESSENGER' ? 'border-blue-500 bg-blue-500/5' : 'border-[var(--border-subtle)] hover:border-blue-500/50'}`}>
                  <div className={`p-3 rounded-full ${channel === 'MESSENGER' ? 'bg-blue-500 text-white' : 'bg-[var(--bg-surface-hover)] text-[var(--text-secondary)]'}`}>
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.14 2 11.25c0 2.91 1.5 5.51 3.86 7.19V22l3.5-1.92c.84.23 1.73.36 2.64.36 5.523 0 10-4.14 10-9.25S17.523 2 12 2zm1.09 12.35l-2.64-2.82-5.15 2.82 5.67-6.04 2.67 2.82 5.11-2.82-5.66 6.04z"/></svg>
                  </div>
                  <span className="font-bold">Messenger</span>
                </button>
              </div>

              {channel === 'WHATSAPP' ? (
                <div>
                  <label className="block text-sm font-bold text-[var(--text-secondary)] mb-1">Choisir un modèle WhatsApp</label>
                  <select 
                    required value={templateId} onChange={e => setTemplateId(e.target.value)}
                    className="w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:border-emerald-500 outline-none"
                  >
                    <option value="" disabled>-- Sélectionnez un modèle approuvé --</option>
                    {templates?.map((t: any) => (
                      <option key={t.id} value={t.id}>{t.name} ({t.language})</option>
                    ))}
                  </select>
                  {templates?.length === 0 && <p className="text-rose-500 text-xs mt-1">Vous n'avez aucun modèle approuvé.</p>}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-[var(--text-secondary)] mb-1">Page Facebook Expéditrice</label>
                    <select 
                      required value={socialAccountId} onChange={e => setSocialAccountId(e.target.value)}
                      className="w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:border-blue-500 outline-none"
                    >
                      <option value="" disabled>-- Sélectionnez une Page Facebook --</option>
                      {facebookAccounts?.map((acc: any) => (
                        <option key={acc.id} value={acc.id}>{acc.accountName || acc.accountId}</option>
                      ))}
                    </select>
                    {facebookAccounts?.length === 0 && <p className="text-rose-500 text-xs mt-1">Aucune page Facebook connectée (allez dans Équipe IA).</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[var(--text-secondary)] mb-1">Message (Texte libre)</label>
                    <textarea 
                      required value={messageText} onChange={e => setMessageText(e.target.value)}
                      placeholder="Bonjour, nous avons une offre spéciale..."
                      className="w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] resize-none h-24 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">Sélectionnez les groupes cibles ({selectedGroups.length} sélectionnés)</label>
                <div className="border border-[var(--border-subtle)] rounded-xl overflow-y-auto max-h-64 bg-[var(--bg-surface-solid)]">
                  {groups?.length === 0 ? (
                    <div className="p-4 text-center text-sm text-[var(--text-secondary)]">Aucun groupe trouvé. Créez des groupes de contacts d'abord.</div>
                  ) : groups?.map((group: any) => (
                    <label key={group.id} className="flex items-center justify-between p-3 border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)] cursor-pointer">
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          checked={selectedGroups.includes(group.id)}
                          onChange={() => toggleGroup(group.id)}
                          className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500"
                        />
                        <div>
                          <div className="font-bold text-sm text-[var(--text-primary)]">{group.name}</div>
                          {group.description && <div className="text-xs text-[var(--text-secondary)]">{group.description}</div>}
                        </div>
                      </div>
                      <div className="text-xs font-bold px-2 py-1 bg-[var(--bg-surface-hover)] rounded-md text-[var(--text-secondary)]">
                        {group._count?.contacts || 0} contacts
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--border-subtle)]">
                <label className="flex items-center gap-3 cursor-pointer group mb-4">
                  <div className={`w-12 h-6 rounded-full p-1 transition-colors ${botEnabled ? 'bg-cyan-500' : 'bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)]'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${botEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                  </div>
                  <div>
                    <div className="font-bold text-[var(--text-primary)]">Activer le Pilotage par l'IA</div>
                    <div className="text-xs text-[var(--text-secondary)]">Si le client répond, l'IA prendra le relais automatiquement.</div>
                  </div>
                </label>

                {botEnabled && (
                  <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-4 animate-in fade-in slide-in-from-top-2">
                    <label className="block text-sm font-bold text-cyan-600 mb-2">Objectif de l'IA (Prompt)</label>
                    <textarea 
                      value={aiGoal} onChange={e => setAiGoal(e.target.value)}
                      placeholder="Ex: Si le client répond, essaie de lui vendre le maillot de bain en promotion avec le code SUMMER20..."
                      className="w-full bg-[var(--bg-base)] border border-cyan-500/30 rounded-xl px-4 py-3 text-[var(--text-primary)] resize-none h-24 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]">
                  Annuler
                </button>
                <button type="submit" disabled={isSubmitting || (channel === 'WHATSAPP' && templates?.length === 0) || (channel === 'MESSENGER' && facebookAccounts?.length === 0)} className="btn-primary-gradient px-8 py-3 rounded-xl font-bold shadow-lg shadow-emerald-500/20">
                  {isSubmitting ? 'Envoi en cours...' : 'Envoyer la campagne'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const CheckCircle = () => <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>;
