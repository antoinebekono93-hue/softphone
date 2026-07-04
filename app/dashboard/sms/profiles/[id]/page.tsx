"use client";

import { useState, useEffect } from "react";
import { MessageSquare, ArrowLeft, Loader2, Link as LinkIcon, Hash } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useParams } from "next/navigation";

type MessagingProfile = {
  id: string;
  telnyxId: string;
  name: string;
  webhookUrl: string | null;
  createdAt: string;
};

type PhoneNumber = {
  id: string;
  number: string;
  friendlyName: string | null;
  messagingProfileId: string | null;
};

export default function MessagingProfileDetailPage() {
  const params = useParams();
  const telnyxId = params.id as string;
  
  const [profile, setProfile] = useState<MessagingProfile | null>(null);
  const [numbers, setNumbers] = useState<PhoneNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Profile Info
      const resProfile = await fetch(`/api/telecom/messaging-profiles/${telnyxId}`);
      if (resProfile.ok) {
        const data = await resProfile.json();
        setProfile(data.profile);
      }
      
      // 2. Fetch User's Numbers
      const resNumbers = await fetch(`/api/telecom/numbers`);
      if (resNumbers.ok) {
        const data = await resNumbers.json();
        setNumbers(data.numbers || []);
      }
    } catch (e) {
      toast.error("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [telnyxId]);

  const handleLinkNumber = async (numberId: string, currentProfileId: string | null) => {
    const isUnlinking = currentProfileId === profile?.id;
    setLinking(numberId);
    
    try {
      const res = await fetch(`/api/telecom/numbers/${numberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messagingProfileId: isUnlinking ? null : profile?.id 
        })
      });
      
      if (res.ok) {
        toast.success(isUnlinking ? "Numéro dissocié" : "Numéro associé avec succès !");
        // Update local state
        setNumbers(numbers.map(n => 
          n.id === numberId ? { ...n, messagingProfileId: isUnlinking ? null : profile!.id } : n
        ));
      } else {
        const data = await res.json();
        toast.error(data.error || "Erreur lors de l'association");
      }
    } catch (e) {
      toast.error("Erreur de connexion");
    } finally {
      setLinking(null);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto w-full flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-10 h-10 animate-spin text-cyan-500" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-8 max-w-7xl mx-auto w-full">
        <h1 className="text-2xl font-bold">Profil introuvable</h1>
        <Link href="/dashboard/sms/profiles" className="text-cyan-500 mt-4 inline-block">Retour</Link>
      </div>
    );
  }

  const linkedNumbers = numbers.filter(n => n.messagingProfileId === profile.id);
  const unlinkedNumbers = numbers.filter(n => n.messagingProfileId !== profile.id);

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <Link href="/dashboard/sms/profiles" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-2 mb-6 w-fit">
        <ArrowLeft className="w-4 h-4" /> Retour aux profils
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <MessageSquare className="w-8 h-8 text-cyan-500" />
          {profile.name}
        </h1>
        <p className="text-[var(--text-secondary)] font-mono text-sm">ID: {profile.telnyxId}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Profile Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel p-6">
            <h3 className="text-lg font-bold mb-4 border-b border-[var(--border-subtle)] pb-2">Informations</h3>
            <div className="space-y-4">
              <div>
                <span className="text-[var(--text-secondary)] text-xs font-semibold uppercase tracking-wider block mb-1">Webhook URL</span>
                <span className="text-sm font-medium text-[var(--text-primary)] break-all">{profile.webhookUrl || "Non configuré"}</span>
              </div>
              <div>
                <span className="text-[var(--text-secondary)] text-xs font-semibold uppercase tracking-wider block mb-1">Créé le</span>
                <span className="text-sm font-medium text-[var(--text-primary)]">{new Date(profile.createdAt).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-[var(--text-secondary)] text-xs font-semibold uppercase tracking-wider block mb-1">Numéros associés</span>
                <span className="text-sm font-medium text-[var(--text-primary)]">{linkedNumbers.length} numéro(s)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Numbers Management */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-0 overflow-hidden">
            <div className="p-6 border-b border-[var(--border-subtle)] bg-[var(--bg-surface-hover)]/30 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">Numéros Associés</h3>
                <p className="text-[var(--text-secondary)] text-sm mt-1">Ces numéros utiliseront ce profil pour envoyer et recevoir des SMS.</p>
              </div>
            </div>
            
            <div className="p-6">
              {linkedNumbers.length === 0 ? (
                <div className="text-center py-8 text-[var(--text-secondary)]">
                  <Hash className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>Aucun numéro n'est associé à ce profil pour le moment.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {linkedNumbers.map(num => (
                    <div key={num.id} className="flex items-center justify-between p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-solid)]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-500 font-bold">
                          {num.number.substring(0, 3)}
                        </div>
                        <div>
                          <div className="font-bold text-[var(--text-primary)]">{num.number}</div>
                          {num.friendlyName && <div className="text-xs text-[var(--text-secondary)]">{num.friendlyName}</div>}
                        </div>
                      </div>
                      <button 
                        onClick={() => handleLinkNumber(num.id, profile.id)}
                        disabled={linking === num.id}
                        className="text-xs font-semibold text-red-500 hover:text-red-400 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2"
                      >
                        {linking === num.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Dissocier"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel p-0 overflow-hidden">
            <div className="p-6 border-b border-[var(--border-subtle)] bg-[var(--bg-surface-hover)]/30">
              <h3 className="text-lg font-bold">Lier d'autres numéros</h3>
              <p className="text-[var(--text-secondary)] text-sm mt-1">Sélectionnez parmi vos autres numéros pour les lier à ce profil.</p>
            </div>
            
            <div className="p-6">
              {unlinkedNumbers.length === 0 ? (
                <div className="text-center py-8 text-[var(--text-secondary)]">
                  <p className="mb-4">Vous n'avez pas d'autres numéros disponibles à lier.</p>
                  <Link href="/dashboard/numbers/buy" className="btn-primary-gradient px-6 py-2.5 text-sm rounded-xl font-semibold inline-flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(0,212,255,0.2)] hover:shadow-[0_0_30px_rgba(0,212,255,0.4)]">
                    Acheter un numéro
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {unlinkedNumbers.map(num => (
                    <div key={num.id} className="flex items-center justify-between p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] transition-colors">
                      <div className="flex items-center gap-3">
                        <Hash className="w-5 h-5 text-[var(--text-secondary)]" />
                        <div>
                          <div className="font-bold text-[var(--text-primary)]">{num.number}</div>
                          <div className="text-xs text-[var(--text-secondary)]">
                            {num.messagingProfileId ? "Lié à un autre profil" : "Aucun profil lié"}
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleLinkNumber(num.id, num.messagingProfileId)}
                        disabled={linking === num.id}
                        className="btn-primary-gradient px-4 py-1.5 text-sm rounded-lg flex items-center gap-2"
                      >
                        {linking === num.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><LinkIcon className="w-3 h-3" /> Lier</>}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
