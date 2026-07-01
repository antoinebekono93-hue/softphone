"use client";

import { useState, useEffect } from "react";
import { Mic2, Play, Download, Loader2, Info } from "lucide-react";

const DEFAULT_VOICES = [
  { id: "Telnyx.NaturalHD.astra", name: "Astra (NaturalHD - English Female)", provider: "telnyx" },
  { id: "Telnyx.NaturalHD.albion", name: "Albion (NaturalHD - English Male)", provider: "telnyx" },
  { id: "Telnyx.NaturalHD.amarante", name: "Amarante (NaturalHD - French Female)", provider: "telnyx" },
  { id: "Telnyx.KokoroTTS.af_heart", name: "Heart (Kokoro - English Female)", provider: "telnyx" },
  { id: "xAI.eve", name: "Eve (Grok - Warm/Conversational)", provider: "xai" },
  { id: "xAI.leo", name: "Leo (Grok - Confident/Direct)", provider: "xai" },
  { id: "Rime.Coda.albion", name: "Albion (Rime Coda - English Male)", provider: "telnyx" },
];

export function TTSClient() {
  const [voices, setVoices] = useState(DEFAULT_VOICES);
  const [text, setText] = useState("Bienvenue sur notre système vocal interactif. Veuillez patienter pendant que nous transférons votre appel.");
  const [voice, setVoice] = useState(DEFAULT_VOICES[0].id);
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCustomVoices = async () => {
      try {
        const res = await fetch("/api/telnyx/voice-clones");
        if (res.ok) {
          const data = await res.json();
          if (data.data && data.data.length > 0) {
            const customVoices = data.data.map((clone: any) => {
              const provider = clone.provider === "telnyx" ? "Telnyx" : "Minimax";
              let model = provider === "Telnyx" ? "Qwen3TTS" : "speech-2.8-turbo";
              if (clone.provider_supported_models?.length > 0) {
                model = clone.provider_supported_models[0];
              }
              const id = `${provider}.${model}.${clone.provider_voice_id}`;
              
              return {
                id,
                name: `${clone.name} (Clone - ${provider})`,
                provider: clone.provider,
                isCustom: true
              };
            });
            setVoices([...DEFAULT_VOICES, ...customVoices]);
          }
        }
      } catch (err) {
        console.error("Failed to load custom voices", err);
      }
    };
    fetchCustomVoices();
  }, []);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError("");
    setAudioUrl(null);

    const selectedVoice = voices.find(v => v.id === voice);

    try {
      const res = await fetch("/api/telecom/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          text, 
          voice: selectedVoice?.id,
          provider: selectedVoice?.provider 
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Generation failed");
      }

      // The response is binary audio
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight mb-2 flex items-center gap-3 text-[var(--text-primary)]">
          <div className="w-10 h-10 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-500">
            <Mic2 className="w-5 h-5" />
          </div>
          Voice Studio (TTS)
        </h1>
        <p className="text-[var(--text-secondary)] text-sm">
          Test and preview Telnyx Text-To-Speech voices, including Ultra, NaturalHD, and xAI Grok.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="glass-panel p-6">
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Message</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              className="w-full bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded-xl p-4 text-sm focus:outline-none focus:border-violet-500 transition-colors text-white resize-y"
              placeholder="Type something to synthesize..."
            />
            
            {voice.startsWith('xAI') && (
              <div className="mt-4 p-4 rounded-xl bg-violet-500/10 border border-violet-500/20 flex gap-3">
                <Info className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
                <div className="text-sm text-violet-200">
                  <p className="font-semibold mb-1">Grok Expressive Mode</p>
                  <p className="opacity-80">You can use inline tags like <code>[pause]</code>, <code>[laugh]</code>, <code>[sigh]</code>, or wrap text with <code>&lt;soft&gt;</code>, <code>&lt;whisper&gt;</code> to control the AI's delivery.</p>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !text.trim()}
            className="w-full btn-primary py-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform active:scale-[0.98] shadow-lg shadow-violet-500/25 disabled:opacity-50 disabled:pointer-events-none"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Generating...
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" /> Generate Audio
              </>
            )}
          </button>

          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm text-center">
              {error}
            </div>
          )}

          {audioUrl && (
            <div className="glass-panel p-6 animate-in slide-in-from-bottom-4 flex flex-col gap-4">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Preview</h3>
              <audio controls src={audioUrl} className="w-full" autoPlay />
              <div className="flex justify-end">
                <a 
                  href={audioUrl} 
                  download={`tts_${voice}_${Date.now()}.mp3`}
                  className="flex items-center gap-2 text-xs text-violet-400 hover:text-violet-300 font-medium"
                >
                  <Download className="w-4 h-4" /> Download MP3
                </a>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="glass-panel p-6">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Voice Settings</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">Select Voice</label>
                <select
                  value={voice}
                  onChange={(e) => setVoice(e.target.value)}
                  className="w-full bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500 text-white"
                >
                  {voices.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
