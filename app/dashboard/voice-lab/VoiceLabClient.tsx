"use client";

import { useState, useEffect, useRef } from "react";
import { Mic2, Play, Download, Loader2, Sparkles, Upload, FileAudio, Check, Save } from "lucide-react";

type VoiceClone = {
  id: string;
  name: string;
  status: string;
  provider: string;
  language: string;
  gender: string;
  provider_supported_models: string[];
  provider_voice_id: string;
};

export function VoiceLabClient() {
  const [activeTab, setActiveTab] = useState<"list" | "design" | "clone">("list");
  
  // List State
  const [clones, setClones] = useState<VoiceClone[]>([]);
  const [isLoadingClones, setIsLoadingClones] = useState(true);

  // Design State
  const [designPrompt, setDesignPrompt] = useState("");
  const [designText, setDesignText] = useState("Bonjour, merci de votre appel. Comment puis-je vous aider aujourd'hui ?");
  const [designName, setDesignName] = useState("");
  const [designGender, setDesignGender] = useState("female");
  const [designProvider, setDesignProvider] = useState("telnyx");
  const [isDesigning, setIsDesigning] = useState(false);
  const [currentDesignId, setCurrentDesignId] = useState<string | null>(null);
  const [designSampleUrl, setDesignSampleUrl] = useState<string | null>(null);
  const [isSavingDesign, setIsSavingDesign] = useState(false);

  // Clone State
  const [cloneName, setCloneName] = useState("");
  const [cloneGender, setCloneGender] = useState("female");
  const [cloneProvider, setCloneProvider] = useState("telnyx");
  const [cloneFile, setCloneFile] = useState<File | null>(null);
  const [isCloning, setIsCloning] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeTab === "list") {
      fetchClones();
    }
  }, [activeTab]);

  const fetchClones = async () => {
    setIsLoadingClones(true);
    try {
      const res = await fetch("/api/telnyx/voice-clones");
      if (res.ok) {
        const data = await res.json();
        setClones(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingClones(false);
    }
  };

  const handleDesignVoice = async () => {
    setIsDesigning(true);
    setError("");
    setDesignSampleUrl(null);
    setCurrentDesignId(null);

    try {
      const res = await fetch("/api/telnyx/voice-designs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: designName || "Sans nom",
          prompt: designPrompt,
          text: designText,
          language: "fr",
          provider: designProvider,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de conception");

      setCurrentDesignId(data.data.id);
      
      // Fetch sample
      const sampleRes = await fetch(`/api/telnyx/voice-designs/${data.data.id}/sample`);
      if (sampleRes.ok) {
        const blob = await sampleRes.blob();
        setDesignSampleUrl(URL.createObjectURL(blob));
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsDesigning(false);
    }
  };

  const handleSaveDesign = async () => {
    if (!currentDesignId) return;
    setIsSavingDesign(true);
    setError("");

    try {
      const res = await fetch("/api/telnyx/voice-clones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: designName || "Ma Voix IA",
          voice_design_id: currentDesignId,
          version: 1,
          language: "fr",
          gender: designGender,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de la sauvegarde");
      }

      setSuccess("Voix enregistrée avec succès !");
      setTimeout(() => {
        setSuccess("");
        setActiveTab("list");
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSavingDesign(false);
    }
  };

  const handleCloneUpload = async () => {
    if (!cloneFile) return;
    setIsCloning(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("audio_file", cloneFile);
      formData.append("name", cloneName || "Clone");
      formData.append("language", "fr");
      formData.append("gender", cloneGender);
      formData.append("provider", cloneProvider);

      const res = await fetch("/api/telnyx/voice-clones/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors du clonage");
      }

      setSuccess("Clonage réussi !");
      setCloneFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      setTimeout(() => {
        setSuccess("");
        setActiveTab("list");
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsCloning(false);
    }
  };

  const constructVoiceId = (clone: VoiceClone) => {
    // Telnyx format is {Provider}.{Model}.{voice_id}
    const provider = clone.provider === "telnyx" ? "Telnyx" : "Minimax";
    let model = "";
    if (provider === "Telnyx") model = "Qwen3TTS";
    if (provider === "Minimax") model = "speech-2.8-turbo";
    
    // Check if the provider_supported_models is available, else fallback to above defaults
    if (clone.provider_supported_models && clone.provider_supported_models.length > 0) {
      model = clone.provider_supported_models[0];
    }
    
    return `${provider}.${model}.${clone.provider_voice_id}`;
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight mb-2 flex items-center gap-3 text-[var(--text-primary)]">
          <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500">
            <Sparkles className="w-5 h-5" />
          </div>
          Laboratoire de Conception Vocale
        </h1>
        <p className="text-[var(--text-secondary)] text-sm">
          Générez une voix à partir d'une description textuelle (IA) ou clonez une voix à partir d'un échantillon audio.
        </p>
      </div>

      <div className="flex border-b border-[var(--border-subtle)]">
        <button
          onClick={() => setActiveTab("list")}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "list" ? "border-indigo-500 text-indigo-400" : "border-transparent text-[var(--text-secondary)] hover:text-white"}`}
        >
          Mes Voix
        </button>
        <button
          onClick={() => setActiveTab("design")}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === "design" ? "border-indigo-500 text-indigo-400" : "border-transparent text-[var(--text-secondary)] hover:text-white"}`}
        >
          <Sparkles className="w-4 h-4" /> Conception IA
        </button>
        <button
          onClick={() => setActiveTab("clone")}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === "clone" ? "border-indigo-500 text-indigo-400" : "border-transparent text-[var(--text-secondary)] hover:text-white"}`}
        >
          <Mic2 className="w-4 h-4" /> Clonage Audio
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500 text-sm flex items-center gap-2">
          <Check className="w-4 h-4" /> {success}
        </div>
      )}

      {activeTab === "list" && (
        <div className="space-y-4">
          <div className="flex justify-end gap-3">
            <button onClick={() => setActiveTab("design")} className="btn-primary px-4 py-2 text-sm rounded-lg flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Créer une voix
            </button>
          </div>
          
          <div className="glass-panel overflow-hidden rounded-xl">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--bg-surface-hover)] border-b border-[var(--border-subtle)]">
                <tr>
                  <th className="p-4 font-medium text-[var(--text-secondary)]">Nom</th>
                  <th className="p-4 font-medium text-[var(--text-secondary)]">ID TTS (Voice ID)</th>
                  <th className="p-4 font-medium text-[var(--text-secondary)]">Fournisseur</th>
                  <th className="p-4 font-medium text-[var(--text-secondary)]">Sexe</th>
                  <th className="p-4 font-medium text-[var(--text-secondary)]">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] text-white">
                {isLoadingClones ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-[var(--text-secondary)]">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Chargement de vos voix...
                    </td>
                  </tr>
                ) : clones.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-[var(--text-secondary)]">
                      Aucune voix personnalisée pour le moment.
                    </td>
                  </tr>
                ) : (
                  clones.map((clone) => (
                    <tr key={clone.id} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                      <td className="p-4 font-medium">{clone.name}</td>
                      <td className="p-4 font-mono text-xs text-[var(--text-secondary)]">
                        {constructVoiceId(clone)}
                      </td>
                      <td className="p-4 capitalize">{clone.provider}</td>
                      <td className="p-4 capitalize">{clone.gender}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 text-xs rounded-md ${
                          clone.status === 'active' ? 'bg-green-500/20 text-green-400' : 
                          clone.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {clone.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "design" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="glass-panel p-6 space-y-4">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-2">Description IA</h3>
              
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Nom de la voix</label>
                <input
                  type="text"
                  value={designName}
                  onChange={(e) => setDesignName(e.target.value)}
                  placeholder="ex: Réceptionniste Chaleureuse"
                  className="w-full bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Description détaillée (Prompt)</label>
                <p className="text-xs text-[var(--text-secondary)] mb-2">Décrivez l'âge, le sexe, le ton, le rythme et l'énergie.</p>
                <textarea
                  value={designPrompt}
                  onChange={(e) => setDesignPrompt(e.target.value)}
                  rows={4}
                  placeholder="Femme, la trentaine. Voix chaleureuse et pleine, légèrement rauque. Débit modéré, on dirait qu'elle sourit en parlant."
                  className="w-full bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 resize-y"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Sexe</label>
                  <select
                    value={designGender}
                    onChange={(e) => setDesignGender(e.target.value)}
                    className="w-full bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="female">Féminin</option>
                    <option value="male">Masculin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Fournisseur</label>
                  <select
                    value={designProvider}
                    onChange={(e) => setDesignProvider(e.target.value)}
                    className="w-full bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="telnyx">Telnyx (Précis)</option>
                    <option value="minimax">Minimax (Expressif)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-panel p-6 space-y-4 flex flex-col h-full">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-2">Génération & Test</h3>
              
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Texte de l'échantillon</label>
                <textarea
                  value={designText}
                  onChange={(e) => setDesignText(e.target.value)}
                  rows={3}
                  className="w-full bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 resize-y"
                />
              </div>

              <div className="pt-4 flex-1 flex flex-col justify-end gap-4">
                <button
                  onClick={handleDesignVoice}
                  disabled={isDesigning || !designPrompt}
                  className="w-full py-3 rounded-lg border border-indigo-500/50 bg-indigo-500/10 text-indigo-400 font-medium flex items-center justify-center gap-2 hover:bg-indigo-500/20 transition-colors disabled:opacity-50"
                >
                  {isDesigning ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Création de la maquette...</>
                  ) : (
                    <><Sparkles className="w-5 h-5" /> Générer un extrait</>
                  )}
                </button>

                {designSampleUrl && (
                  <div className="p-4 rounded-xl bg-[var(--bg-surface-solid)] border border-indigo-500/30 animate-in slide-in-from-bottom-4 space-y-4">
                    <audio controls src={designSampleUrl} className="w-full" autoPlay />
                    
                    <button
                      onClick={handleSaveDesign}
                      disabled={isSavingDesign}
                      className="w-full btn-primary py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
                    >
                      {isSavingDesign ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /> Enregistrement...</>
                      ) : (
                        <><Save className="w-5 h-5" /> Enregistrer cette voix (Cloner)</>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "clone" && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="glass-panel p-8 space-y-6">
            <h3 className="text-xl font-semibold text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-4 flex items-center gap-3">
              <Mic2 className="w-6 h-6 text-indigo-400" /> Cloner à partir d'un audio
            </h3>
            
            <p className="text-sm text-[var(--text-secondary)]">
              Téléversez un enregistrement clair, sans bruit de fond. Durée recommandée : 5-10s pour Telnyx, 1-2 minutes pour Minimax.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Nom de la voix</label>
                <input
                  type="text"
                  value={cloneName}
                  onChange={(e) => setCloneName(e.target.value)}
                  placeholder="ex: Voix de Michel"
                  className="w-full bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Sexe</label>
                  <select
                    value={cloneGender}
                    onChange={(e) => setCloneGender(e.target.value)}
                    className="w-full bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="female">Féminin</option>
                    <option value="male">Masculin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Fournisseur (Modèle)</label>
                  <select
                    value={cloneProvider}
                    onChange={(e) => setCloneProvider(e.target.value)}
                    className="w-full bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="telnyx">Telnyx Qwen3TTS (Rapide, max 10s)</option>
                    <option value="minimax">Minimax (Jusqu'à 5min)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Fichier Audio (WAV, MP3)</label>
                <label className="border-2 border-dashed border-[var(--border-subtle)] hover:border-indigo-500 bg-[var(--bg-surface-hover)] rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors">
                  <input
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={(e) => setCloneFile(e.target.files?.[0] || null)}
                  />
                  <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    {cloneFile ? <FileAudio className="w-6 h-6" /> : <Upload className="w-6 h-6" />}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-white">
                      {cloneFile ? cloneFile.name : "Cliquez pour uploader un fichier"}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      {cloneFile ? `${(cloneFile.size / 1024 / 1024).toFixed(2)} MB` : "Taille maximale : 5MB (Telnyx) ou 20MB (Minimax)"}
                    </p>
                  </div>
                </label>
              </div>

              <div className="pt-6">
                <button
                  onClick={handleCloneUpload}
                  disabled={isCloning || !cloneFile || !cloneName}
                  className="w-full btn-primary py-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform shadow-lg shadow-indigo-500/25 disabled:opacity-50"
                >
                  {isCloning ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Clonage en cours...</>
                  ) : (
                    <><Save className="w-5 h-5" /> Lancer le clonage</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
