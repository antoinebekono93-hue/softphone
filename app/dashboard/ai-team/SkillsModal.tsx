"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2, Webhook, Wrench, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { getAgentSkills, createAgentSkill, deleteAgentSkill } from "../ai-employees/skills-actions";

export default function SkillsModal({ onClose, employeeId, employeeName }: { onClose: () => void, employeeId: string, employeeName?: string }) {
  const [skills, setSkills] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    endpointUrl: "",
    method: "POST",
    parametersSchema: `{\n  "type": "object",\n  "properties": {\n    "example_param": { "type": "string" }\n  },\n  "required": ["example_param"]\n}`
  });

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    try {
      const data = await getAgentSkills(employeeId);
      setSkills(data);
    } catch (e) {
      toast.error("Erreur de chargement des skills");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.description || !formData.endpointUrl) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    // Validate JSON schema
    let parsedSchema;
    try {
      parsedSchema = JSON.parse(formData.parametersSchema);
    } catch (e) {
      toast.error("Format JSON invalide pour le schéma des paramètres");
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading("Création et synchronisation avec OpenAI...");
    try {
      const newSkill = await createAgentSkill(employeeId, {
        ...formData,
        parametersSchema: parsedSchema
      });
      setSkills([newSkill, ...skills]);
      toast.success("Skill créé !", { id: toastId });
      setIsCreating(false);
      setFormData({
        name: "",
        description: "",
        endpointUrl: "",
        method: "POST",
        parametersSchema: `{\n  "type": "object",\n  "properties": {}\n}`
      });
    } catch (e) {
      toast.error("Erreur lors de la création", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce Skill ?")) return;
    
    const toastId = toast.loading("Suppression...");
    try {
      await deleteAgentSkill(id, employeeId);
      setSkills(skills.filter(s => s.id !== id));
      toast.success("Skill supprimé", { id: toastId });
    } catch (e) {
      toast.error("Erreur lors de la suppression", { id: toastId });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[var(--bg-base)] w-full max-w-2xl rounded-3xl shadow-2xl border border-[var(--border-subtle)] overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between sticky top-0 bg-[var(--bg-base)]/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-[var(--text-primary)]">Skills & Actions</h3>
              <p className="text-sm text-[var(--text-secondary)]">{employeeName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-6">
          
          {/* List of skills */}
          {!isCreating && (
            <>
              <div className="flex justify-between items-center">
                <p className="text-sm text-[var(--text-secondary)]">Actions que l'IA peut déclencher.</p>
                <button 
                  onClick={() => setIsCreating(true)}
                  className="flex items-center gap-2 bg-[var(--accent-primary)] text-[var(--accent-foreground)] px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  <Plus className="w-4 h-4" />
                  Nouveau Skill
                </button>
              </div>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-[var(--accent-primary)] animate-spin" />
                  <p className="text-sm text-[var(--text-secondary)] mt-4">Chargement des skills...</p>
                </div>
              ) : skills.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-[var(--border-subtle)] rounded-2xl">
                  <Wrench className="w-12 h-12 text-[var(--text-secondary)] opacity-50 mx-auto mb-3" />
                  <p className="font-medium text-[var(--text-primary)]">Aucun Skill</p>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">Cet agent n'a pas encore de capacités personnalisées.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {skills.map(skill => (
                    <div key={skill.id} className="p-4 bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded-2xl flex items-center justify-between group">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[var(--text-primary)]">{skill.name}</span>
                          <span className="text-xs font-mono bg-[var(--bg-base)] px-2 py-0.5 rounded-full text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                            {skill.method}
                          </span>
                        </div>
                        <p className="text-sm text-[var(--text-secondary)] mt-1 line-clamp-1">{skill.description}</p>
                        <p className="text-xs text-[var(--text-secondary)]/70 mt-1 flex items-center gap-1">
                          <Webhook className="w-3 h-3" /> {skill.endpointUrl}
                        </p>
                      </div>
                      <button 
                        onClick={() => handleDelete(skill.id)}
                        className="p-2 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500/10 rounded-lg"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Create Form */}
          {isCreating && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Nom de la fonction (snake_case) *</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')})}
                  className="w-full bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded-xl px-4 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  placeholder="ex: check_inventory"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Description *</label>
                <p className="text-xs text-[var(--text-secondary)]/70 mb-2">Expliquez à l'IA exactement QUAND et POURQUOI utiliser cette action.</p>
                <textarea 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded-xl px-4 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] min-h-[80px]"
                  placeholder="ex: Récupère la disponibilité d'un produit en utilisant son identifiant SKU."
                />
              </div>
              <div className="flex gap-4">
                <div className="w-1/3">
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Méthode</label>
                  <select 
                    value={formData.method} 
                    onChange={e => setFormData({...formData, method: e.target.value})}
                    className="w-full bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded-xl px-4 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                  </select>
                </div>
                <div className="w-2/3">
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Webhook URL *</label>
                  <input 
                    type="url" 
                    value={formData.endpointUrl} 
                    onChange={e => setFormData({...formData, endpointUrl: e.target.value})}
                    className="w-full bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded-xl px-4 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                    placeholder="https://hook.make.com/..."
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Schéma des Paramètres (JSON) *</label>
                <textarea 
                  value={formData.parametersSchema} 
                  onChange={e => setFormData({...formData, parametersSchema: e.target.value})}
                  className="w-full font-mono text-xs bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] min-h-[150px]"
                />
              </div>

              <div className="flex gap-3 pt-4 justify-end border-t border-[var(--border-subtle)]">
                <button onClick={() => setIsCreating(false)} className="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium">Annuler</button>
                <button 
                  onClick={handleCreate} 
                  disabled={isSaving}
                  className="bg-[var(--accent-primary)] text-[var(--accent-foreground)] px-6 py-2 rounded-xl font-medium flex items-center gap-2 hover:opacity-90 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Ajouter ce Skill
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
