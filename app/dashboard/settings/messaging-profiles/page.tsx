"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Plus, Loader2, ArrowLeft, MoreVertical, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

type MessagingProfile = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  record_type: string;
};

export default function MessagingProfilesPage() {
  const [profiles, setProfiles] = useState<MessagingProfile[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isCreating, setIsCreating] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [creatingSubmitting, setCreatingSubmitting] = useState(false);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/telecom/messaging-profiles");
      if (res.ok) {
        const data = await res.json();
        setProfiles(data.profiles || []);
      } else {
        toast.error("Erreur lors du chargement des profils");
      }
    } catch (e) {
      toast.error("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;

    setCreatingSubmitting(true);
    try {
      const res = await fetch("/api/telecom/messaging-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newProfileName })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast.success("Profil créé avec succès !");
        setProfiles((prev) => [data.profile, ...prev]);
        setIsCreating(false);
        setNewProfileName("");
      } else {
        toast.error(data.error || "Erreur lors de la création");
      }
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
          <form onSubmit={handleCreateProfile} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
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
            <div className="flex gap-4 w-full md:w-auto">
              <button 
                type="button" 
                onClick={() => setIsCreating(false)}
                className="px-6 py-3 rounded-xl font-semibold border border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)] transition-colors"
              >
                Annuler
              </button>
              <button 
                type="submit" 
                disabled={creatingSubmitting}
                className="btn-primary-gradient px-8 py-3 flex items-center gap-2 flex-1 md:flex-auto justify-center"
              >
                {creatingSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Enregistrer"}
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
                    <td className="px-6 py-4 font-medium text-[var(--text-primary)] flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                        <MessageSquare className="w-4 h-4 text-cyan-500" />
                      </div>
                      {profile.name}
                    </td>
                    <td className="px-6 py-4 font-mono text-[var(--text-secondary)] text-xs">
                      {profile.id}
                    </td>
                    <td className="px-6 py-4 text-[var(--text-secondary)]">
                      {new Date(profile.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-solid)] rounded-lg transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
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
