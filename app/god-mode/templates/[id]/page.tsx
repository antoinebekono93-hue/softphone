'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Save, ArrowLeft, Brain, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function GodModeTemplateEdit() {
  const params = useParams();
  const router = useRouter();
  const isNew = params.id === 'new';
  
  const [formData, setFormData] = useState({
    name: '',
    jobTitle: '',
    roleType: 'GENERAL',
    description: '',
    systemPrompt: '',
    skills: '[]',
    tones: '[]',
    color: 'text-zinc-800',
    bgColor: 'bg-zinc-800/10'
  });

  const [parsedTones, setParsedTones] = useState<{name: string, prompt: string}[]>([]);
  const [parsedSkills, setParsedSkills] = useState<string[]>([]);

  useEffect(() => {
    if (!isNew) {
      fetch(`/api/god-mode/templates/${params.id}`)
        .then(res => res.json())
        .then(data => {
          setFormData(data);
          try {
            setParsedTones(JSON.parse(data.tones || '[]'));
            setParsedSkills(JSON.parse(data.skills || '[]'));
          } catch(e) {}
        });
    }
  }, [isNew, params.id]);

  const handleSave = async () => {
    const payload = {
      ...formData,
      tones: JSON.stringify(parsedTones),
      skills: JSON.stringify(parsedSkills)
    };

    const method = isNew ? 'POST' : 'PUT';
    const url = isNew ? '/api/god-mode/templates' : `/api/god-mode/templates/${params.id}`;

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    router.push('/god-mode/templates');
  };

  const addTone = () => setParsedTones([...parsedTones, { name: 'Nouveau Ton', prompt: 'Comportement spécifique...' }]);
  const updateTone = (index: number, field: string, value: string) => {
    const newTones = [...parsedTones];
    newTones[index] = { ...newTones[index], [field]: value };
    setParsedTones(newTones);
  };
  const removeTone = (index: number) => setParsedTones(parsedTones.filter((_, i) => i !== index));

  return (
    <div className="space-y-8 max-w-5xl pb-20">
      <div className="flex items-center gap-4">
        <Link href="/god-mode/templates" className="p-2 hover:bg-[var(--bg-surface-hover)] rounded-xl">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">
          {isNew ? 'Créer un Template' : 'Configurer l\'Âme'}
        </h2>
        <div className="flex-1" />
        <button onClick={handleSave} className="bg-[var(--accent-primary)] text-white px-6 py-2 rounded-xl flex items-center gap-2">
          <Save className="w-5 h-5" />
          Enregistrer
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h3 className="font-bold text-lg border-b pb-2">Profil Public (Vu par le client)</h3>
          <div>
            <label className="block text-sm mb-1 text-[var(--text-secondary)]">Nom</label>
            <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-lg p-2" />
          </div>
          <div>
            <label className="block text-sm mb-1 text-[var(--text-secondary)]">Poste</label>
            <input type="text" value={formData.jobTitle} onChange={e => setFormData({...formData, jobTitle: e.target.value})} className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-lg p-2" />
          </div>
          <div>
            <label className="block text-sm mb-1 text-[var(--text-secondary)]">Type de Rôle</label>
            <select value={formData.roleType} onChange={e => setFormData({...formData, roleType: e.target.value})} className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-lg p-2">
              <option value="GENERAL">General</option>
              <option value="FACEBOOK_MANAGER">Facebook Manager</option>
              <option value="LINKEDIN_MANAGER">LinkedIn Manager</option>
              <option value="TIKTOK_MANAGER">TikTok Manager</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1 text-[var(--text-secondary)]">CV / Description Vendeuse</label>
            <textarea rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-lg p-2 resize-none" placeholder="Master en stratégie digitale, expert B2B..." />
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="font-bold text-lg border-b pb-2 flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-500" /> Cerveau IA (Caché du client)
          </h3>
          <div>
            <label className="block text-sm mb-1 text-[var(--text-secondary)]">System Prompt Principal</label>
            <textarea rows={8} value={formData.systemPrompt} onChange={e => setFormData({...formData, systemPrompt: e.target.value})} className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-lg p-2 resize-none font-mono text-sm text-purple-400" placeholder="Tu es un expert en..." />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm text-[var(--text-secondary)]">Tons / Comportements (Au choix du client)</label>
              <button onClick={addTone} className="text-xs flex items-center gap-1 bg-[var(--bg-surface-hover)] px-2 py-1 rounded">
                <Plus className="w-3 h-3" /> Ajouter
              </button>
            </div>
            <div className="space-y-3">
              {parsedTones.map((tone, idx) => (
                <div key={idx} className="p-3 border border-[var(--border-subtle)] rounded-lg bg-[var(--bg-base)]">
                  <div className="flex gap-2 mb-2">
                    <input type="text" value={tone.name} onChange={e => updateTone(idx, 'name', e.target.value)} placeholder="Nom du ton (ex: Chaleureux)" className="flex-1 bg-transparent border-b border-[var(--border-subtle)] outline-none text-sm font-bold" />
                    <button onClick={() => removeTone(idx)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <textarea rows={2} value={tone.prompt} onChange={e => updateTone(idx, 'prompt', e.target.value)} placeholder="Ajout au prompt: Sois très amical..." className="w-full bg-transparent outline-none text-xs text-[var(--text-secondary)] resize-none" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
