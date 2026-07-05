"use client";

import { useState } from "react";
import { Megaphone, Users, MessageSquare, Play, CalendarClock, Target } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CampaignsClient({ contacts, templates, initialCampaigns }: any) {
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const toggleContact = (id: string) => {
    setSelectedContacts(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateId || selectedContacts.length === 0) return alert("Sélectionnez un modèle et au moins un contact.");

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/whatsapp/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          templateId,
          contactIds: selectedContacts
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
      setSelectedContacts([]);
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
            <Megaphone className="text-emerald-500" /> Campagnes WhatsApp
          </h1>
          <p className="text-[var(--text-secondary)] mt-2">Envoyez des messages groupés en utilisant vos modèles approuvés.</p>
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
                <th className="p-4 font-semibold">Statut</th>
                <th className="p-4 font-semibold">Modèle utilisé</th>
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
                    <span className="px-2 py-1 text-xs font-bold rounded-md bg-emerald-500/10 text-emerald-500">{campaign.status}</span>
                  </td>
                  <td className="p-4 text-[var(--text-secondary)]">{campaign.template?.name || "N/A"}</td>
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
              
              <div>
                <label className="block text-sm font-bold text-[var(--text-secondary)] mb-1">Choisir un modèle WhatsApp</label>
                <select 
                  required value={templateId} onChange={e => setTemplateId(e.target.value)}
                  className="w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:border-emerald-500 outline-none"
                >
                  <option value="" disabled>-- Sélectionnez un modèle approuvé --</option>
                  {templates.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.name} ({t.language})</option>
                  ))}
                </select>
                {templates.length === 0 && <p className="text-rose-500 text-xs mt-1">Vous n'avez aucun modèle approuvé.</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">Sélectionnez les destinataires ({selectedContacts.length} sélectionnés)</label>
                <div className="border border-[var(--border-subtle)] rounded-xl overflow-y-auto max-h-64 bg-[var(--bg-surface-solid)]">
                  {contacts.length === 0 ? (
                    <div className="p-4 text-center text-sm text-[var(--text-secondary)]">Aucun contact trouvé. Ajoutez des contacts d'abord.</div>
                  ) : contacts.map((contact: any) => (
                    <label key={contact.id} className="flex items-center gap-3 p-3 border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)] cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={selectedContacts.includes(contact.id)}
                        onChange={() => toggleContact(contact.id)}
                        className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500"
                      />
                      <div>
                        <div className="font-bold text-sm text-[var(--text-primary)]">{contact.name || contact.phone}</div>
                        {contact.name && <div className="text-xs text-[var(--text-secondary)]">{contact.phone}</div>}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]">
                  Annuler
                </button>
                <button type="submit" disabled={isSubmitting || templates.length === 0} className="btn-primary-gradient px-8 py-3 rounded-xl font-bold shadow-lg shadow-emerald-500/20">
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
