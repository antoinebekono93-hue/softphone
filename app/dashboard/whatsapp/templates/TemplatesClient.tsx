"use client";

import { useState } from "react";
import { MessageSquarePlus, Clock, CheckCircle2, AlertCircle, FileText, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export default function TemplatesClient({ initialTemplates, hasAccount }: { initialTemplates: any[], hasAccount: boolean }) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("MARKETING");
  const [language, setLanguage] = useState("fr");
  const [bodyText, setBodyText] = useState("Bonjour {{1}}, nous avons une offre pour vous.");
  
  // Nouveaux états pour les boutons interactifs
  const [buttonType, setButtonType] = useState<"NONE" | "QUICK_REPLY" | "URL">("NONE");
  const [buttonText, setButtonText] = useState("");
  const [buttonUrl, setButtonUrl] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const components: any[] = [{ type: "BODY", text: bodyText }];
      
      if (buttonType === "QUICK_REPLY" && buttonText) {
        components.push({
          type: "BUTTONS",
          buttons: [{ type: "QUICK_REPLY", text: buttonText }]
        });
      } else if (buttonType === "URL" && buttonText && buttonUrl) {
        components.push({
          type: "BUTTONS",
          buttons: [{ type: "URL", text: buttonText, url: buttonUrl }]
        });
      }

      const res = await fetch("/api/whatsapp/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, category, language, components })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create template");
      }

      const data = await res.json();
      setTemplates([data.template, ...templates]);
      setIsModalOpen(false);
      setName("");
      setBodyText("");
      setButtonType("NONE");
      setButtonText("");
      setButtonUrl("");
      router.refresh();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!hasAccount) {
    return (
      <div className="glass-panel p-8 text-center rounded-2xl border-rose-500/30">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Compte WhatsApp non connecté</h2>
        <p className="text-[var(--text-secondary)] mb-6">Vous devez d'abord lier votre compte WhatsApp Business pour créer des modèles.</p>
        <button onClick={() => router.push('/dashboard/whatsapp/connect')} className="btn-primary-gradient px-6 py-3">
          Connecter WhatsApp
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] flex items-center gap-3">
            <FileText className="text-emerald-500" /> Modèles (Templates) WhatsApp
          </h1>
          <p className="text-[var(--text-secondary)] mt-2">Créez et gérez vos modèles approuvés par Meta pour initier des conversations.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary-gradient px-6 py-3 flex items-center gap-2">
          <MessageSquarePlus className="w-5 h-5" />
          Nouveau Modèle
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map(template => {
          const components = JSON.parse(template.content || "[]");
          const body = components.find((c:any) => c.type === 'BODY')?.text;
          const buttons = components.find((c:any) => c.type === 'BUTTONS')?.buttons || [];
          
          return (
            <div key={template.id} className="glass-panel p-6 rounded-2xl flex flex-col h-full border border-[var(--border-subtle)]">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg text-[var(--text-primary)]">{template.name}</h3>
                  <span className="text-xs text-[var(--text-secondary)]">{template.category} • {template.language.toUpperCase()}</span>
                </div>
                <span className={`px-2 py-1 text-xs font-bold rounded-md ${
                  template.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-500' : 
                  template.status === 'PENDING' ? 'bg-amber-500/10 text-amber-500' : 'bg-rose-500/10 text-rose-500'
                }`}>
                  {template.status}
                </span>
              </div>
              
              <div className="bg-[var(--bg-surface-solid)] p-4 rounded-xl flex-1 mb-4 border border-[var(--border-subtle)]">
                <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap mb-4">
                  {body || "Contenu non disponible"}
                </p>
                {buttons.length > 0 && (
                  <div className="flex flex-col gap-2 mt-auto border-t border-[var(--border-subtle)] pt-4">
                    {buttons.map((btn: any, idx: number) => (
                      <div key={idx} className="text-center p-2 rounded-lg bg-[var(--bg-base)] text-emerald-500 font-bold text-sm border border-[var(--border-subtle)]">
                        {btn.text} {btn.type === 'URL' && '(Lien)'}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
        {templates.length === 0 && (
          <div className="col-span-full p-12 text-center text-[var(--text-secondary)] border-2 border-dashed border-[var(--border-subtle)] rounded-2xl">
            Aucun modèle pour le moment. Créez-en un pour démarrer.
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-2xl p-8 max-w-xl w-full shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Créer un modèle interactif</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-[var(--text-secondary)] mb-1">Nom du modèle</label>
                <input 
                  type="text" required value={name} onChange={e => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                  className="w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:border-emerald-500 outline-none"
                  placeholder="promo_mars"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-[var(--text-secondary)] mb-1">Catégorie</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:border-emerald-500 outline-none">
                    <option value="MARKETING">Marketing</option>
                    <option value="UTILITY">Utilité (Alerte)</option>
                    <option value="AUTHENTICATION">Authentification (OTP)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-[var(--text-secondary)] mb-1">Langue</label>
                  <select value={language} onChange={e => setLanguage(e.target.value)} className="w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:border-emerald-500 outline-none">
                    <option value="fr">Français (fr)</option>
                    <option value="en_US">Anglais (en_US)</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-[var(--text-secondary)] mb-1">Texte du message (Corps)</label>
                <textarea 
                  required value={bodyText} onChange={e => setBodyText(e.target.value)} rows={4}
                  className="w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:border-emerald-500 outline-none resize-none"
                />
              </div>

              {/* Boutons Interactifs */}
              <div className="border border-[var(--border-subtle)] rounded-xl p-4 bg-[var(--bg-surface-solid)]">
                <label className="block text-sm font-bold text-[var(--text-primary)] mb-4">Bouton interactif (Optionnel)</label>
                <select value={buttonType} onChange={e => setButtonType(e.target.value as any)} className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:border-emerald-500 outline-none mb-4">
                  <option value="NONE">Aucun bouton</option>
                  <option value="QUICK_REPLY">Bouton de Réponse Rapide</option>
                  <option value="URL">Lien Web (Call to Action)</option>
                </select>

                {buttonType !== "NONE" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Texte du bouton (ex: M'inscrire)</label>
                      <input 
                        type="text" required value={buttonText} onChange={e => setButtonText(e.target.value)} maxLength={25}
                        className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-4 py-2 text-[var(--text-primary)] focus:border-emerald-500 outline-none"
                      />
                    </div>
                    {buttonType === "URL" && (
                      <div>
                        <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">URL (ex: https://monsite.com)</label>
                        <input 
                          type="url" required value={buttonUrl} onChange={e => setButtonUrl(e.target.value)}
                          className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-4 py-2 text-[var(--text-primary)] focus:border-emerald-500 outline-none"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]">
                  Annuler
                </button>
                <button type="submit" disabled={isSubmitting} className="btn-primary-gradient px-8 py-3 rounded-xl font-bold shadow-lg shadow-emerald-500/20">
                  {isSubmitting ? 'Soumission...' : 'Soumettre à Meta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
