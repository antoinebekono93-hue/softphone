"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Plus, Loader2, ArrowLeft, MoreVertical, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

type MessagingProfile = {
  id: string;
  telnyxId: string;
  name: string;
  webhookUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function MessagingProfilesPage() {
  const [profiles, setProfiles] = useState<MessagingProfile[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isCreating, setIsCreating] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [creatingSubmitting, setCreatingSubmitting] = useState(false);
  const [unlinkedNumbers, setUnlinkedNumbers] = useState<any[]>([]);
  const [selectedNumberIds, setSelectedNumberIds] = useState<string[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch profiles
      const resProfiles = await fetch("/api/telecom/messaging-profiles");
      if (resProfiles.ok) {
        const data = await resProfiles.json();
        setProfiles(data.profiles || []);
      }
      
      // 2. Fetch all numbers to find unlinked ones
      const resNumbers = await fetch("/api/telecom/numbers");
      if (resNumbers.ok) {
        const data = await resNumbers.json();
        const available = (data.numbers || []).filter((n: any) => !n.messagingProfileId);
        setUnlinkedNumbers(available);
      }
    } catch (e) {
      toast.error("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;

    setCreatingSubmitting(true);
    try {
      // 1. Create Profile
      const res = await fetch("/api/telecom/messaging-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newProfileName })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        toast.error(data.error || "Erreur lors de la création");
        setCreatingSubmitting(false);
        return;
      }
      
      const newProfile = data.profile;
      
      // 2. Link selected numbers
      if (selectedNumberIds.length > 0) {
        for (const numId of selectedNumberIds) {
          await fetch(`/api/telecom/numbers/${numId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messagingProfileId: newProfile.id })
          });
        }
      }

      toast.success("Profil créé et configuré avec succès !");
      setProfiles((prev) => [newProfile, ...prev]);
      setIsCreating(false);
      setNewProfileName("");
      setSelectedNumberIds([]);
      // Refresh numbers
      fetchData();
    } catch (e) {
      toast.error("Erreur de connexion");
    } finally {
      setCreatingSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <Link href="/dashboard/settings" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-2 mb-6 w-fit">
        <ArrowLeft className="w-4 h-4" /> Retour aux Paramètres
      </Link>

      <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-cyan-500" />
            Profils de Messagerie
          </h1>
          <p className="text-[var(--text-secondary)]">Gérez vos profils pour l'envoi et la réception de SMS/MMS via Telnyx.</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="btn-primary-gradient px-6 py-2.5 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Créer un Profil
        </button>
      </div>

      {isCreating && (
        <div className="glass-panel p-6 mb-8 border-cyan-500/30 shadow-[0_0_30px_rgba(0,212,255,0.1)]">
          <h2 className="text-xl font-bold mb-4">Nouveau Profil de Messagerie</h2>
          <form onSubmit={handleCreateProfile} className="space-y-6">
            <div className="w-full">
              <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">Nom du profil (visible par vous)</label>
              <input 
                type="text" 
                placeholder="Ex: Campagnes Marketing France" 
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                autoFocus
                required
                className="w-full px-4 py-3 bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-xl font-medium text-[var(--text-primary)] focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="w-full">
              <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-3">Lier des numéros (Optionnel)</label>
              
              {unlinkedNumbers.length === 0 ? (
                <div className="text-[var(--text-secondary)] text-sm p-4 bg-[var(--bg-surface-solid)] rounded-xl border border-[var(--border-subtle)]">
                  Vous n'avez aucun numéro disponible à lier. Vous pourrez en ajouter plus tard.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {unlinkedNumbers.map(num => (
                    <label key={num.id} className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-solid)] cursor-pointer hover:border-cyan-500/50 transition-colors">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-[var(--border-subtle)] text-cyan-500 focus:ring-cyan-500"
                        checked={selectedNumberIds.includes(num.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedNumberIds([...selectedNumberIds, num.id]);
                          } else {
                            setSelectedNumberIds(selectedNumberIds.filter(id => id !== num.id));
                          }
                        }}
                      />
                      <div>
                        <div className="font-medium text-[var(--text-primary)]">{num.number}</div>
                        {num.friendlyName && <div className="text-xs text-[var(--text-secondary)]">{num.friendlyName}</div>}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-4 w-full md:w-auto pt-4 border-t border-[var(--border-subtle)] justify-end">
              <button 
                type="button" 
                onClick={() => {
                  setIsCreating(false);
                  setSelectedNumberIds([]);
                }}
                className="px-6 py-3 rounded-xl font-semibold border border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)] transition-colors"
              >
                Annuler
              </button>
              <button 
                type="submit" 
                disabled={creatingSubmitting}
                className="btn-primary-gradient px-8 py-3 flex items-center gap-2"
              >
                {creatingSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Créer le profil"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="glass-panel overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 text-[var(--text-secondary)]">
            <Loader2 className="w-10 h-10 animate-spin text-cyan-500 mb-4" />
            <p>Synchronisation avec Telnyx en cours...</p>
          </div>
        ) : profiles.length === 0 ? (
          <div className="p-12 text-center text-[var(--text-secondary)]">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Aucun profil de messagerie</h3>
            <p className="max-w-md mx-auto mb-6">Vous n'avez pas encore créé de profil de messagerie sur Telnyx. Vous devez en créer un avant de pouvoir acheter un numéro capable d'envoyer des SMS.</p>
            <button 
              onClick={() => setIsCreating(true)}
              className="text-cyan-500 hover:text-cyan-400 font-semibold"
            >
              Créer votre premier profil
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-[var(--text-secondary)] uppercase bg-[var(--bg-surface-hover)] border-b border-[var(--border-subtle)]">
                <tr>
                  <th className="px-6 py-4 font-semibold">Nom du Profil</th>
                  <th className="px-6 py-4 font-semibold">ID Telnyx</th>
                  <th className="px-6 py-4 font-semibold">Créé le</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((profile) => (
                  <tr key={profile.id} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)]/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-[var(--text-primary)]">
                      <Link href={`/dashboard/sms/profiles/${profile.telnyxId}`} className="flex items-center gap-3 hover:text-cyan-500 transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                          <MessageSquare className="w-4 h-4 text-cyan-500" />
                        </div>
                        {profile.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 font-mono text-[var(--text-secondary)] text-xs">
                      {profile.telnyxId}
                    </td>
                    <td className="px-6 py-4 text-[var(--text-secondary)]">
                      {new Date(profile.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/dashboard/sms/profiles/${profile.telnyxId}`} className="p-2 inline-flex text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-solid)] rounded-lg transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
