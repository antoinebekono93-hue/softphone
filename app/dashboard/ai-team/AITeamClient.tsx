"use client";

import { useState, useEffect } from "react";
import { Plus, Bot, Phone, MessageSquare, Briefcase, Settings2, Trash2, Brain, Headset, Calendar, Sparkles, MessageCircle, ArrowLeft, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import KnowledgeBaseModal from "./KnowledgeBaseModal";
import SkillsModal from "./SkillsModal";
import { Wrench } from "lucide-react";

const AI_TEMPLATES = [
  {
    id: "orchestrator",
    name: "Charly+",
    jobTitle: "Orchestrateur & Superviseur",
    icon: Brain,
    color: "text-indigo-500",
    bgColor: "bg-indigo-500/10",
    skills: ["Supervision d'équipe IA", "Gestion de To-do list", "Routage complexe"],
    systemPrompt: "Tu es Charly+, le superviseur de l'équipe IA. Ton rôle est d'orchestrer les demandes complexes, de gérer la to-do list du client et de déléguer si nécessaire. Règle n°1 : Sois direct et extrêmement efficace. Règle n°2 : Structure toujours tes réponses de manière claire (puces, numéros). Règle n°3 : Si une tâche dépasse tes compétences, demande au client des précisions ou transfère à un humain."
  },
  {
    id: "support",
    name: "Emma",
    jobTitle: "Agent de Support Client",
    icon: Headset,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    skills: ["Empathie et écoute", "Résolution de problèmes", "Recherche dans la base de connaissances"],
    systemPrompt: "Tu es Emma, une agente de support client chaleureuse et professionnelle. Ta mission principale est d'aider les clients à résoudre leurs problèmes rapidement. Règle n°1 : Sois toujours polie et rassurante. Règle n°2 : Utilise la base de connaissances pour trouver des réponses précises. Règle n°3 : Si tu ne peux pas résoudre le problème, propose gentiment d'escalader la demande à un humain."
  },
  {
    id: "sales",
    name: "Lucas",
    jobTitle: "Commercial B2B",
    icon: Briefcase,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    skills: ["Qualification de leads", "Génération de devis", "Négociation et vente croisée"],
    systemPrompt: "Tu es Lucas, un commercial B2B dynamique et persuasif. Ton objectif est de qualifier les prospects et de conclure des ventes. Règle n°1 : Pose des questions ouvertes pour comprendre les besoins du client. Règle n°2 : Mets en avant les bénéfices de nos produits. Règle n°3 : N'invente jamais de prix, vérifie toujours dans le catalogue. Règle n°4 : Propose de générer un devis dès que le client montre un intérêt d'achat."
  },
  {
    id: "marketing",
    name: "John",
    jobTitle: "Expert Marketing & Social",
    icon: Sparkles,
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
    skills: ["Création de contenu", "Stratégie Social Media", "Copywriting persuasif"],
    systemPrompt: "Tu es John, un expert en marketing digital et copywriting. Ton rôle est de conseiller le client sur sa stratégie de contenu (LinkedIn, Instagram) et de rédiger des posts accrocheurs. Règle n°1 : Adopte un ton créatif et engageant. Règle n°2 : Utilise des structures de copywriting éprouvées (AIDA, PAS). Règle n°3 : Suggère toujours un appel à l'action (CTA) puissant."
  },
  {
    id: "seo",
    name: "Lou",
    jobTitle: "Expert SEO & Contenu",
    icon: MessageSquare,
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
    skills: ["Audit sémantique", "Rédaction web", "Optimisation On-page"],
    systemPrompt: "Tu es Lou, une experte en référencement naturel (SEO) et rédaction de contenu. Ton objectif est d'aider le client à gagner en visibilité sur Google. Règle n°1 : Privilégie un ton pédagogique et analytique. Règle n°2 : Conseille sur le choix des mots-clés de longue traîne. Règle n°3 : Rédige toujours avec une structure optimisée (H1, H2, introduction accrocheuse)."
  },
  {
    id: "appointment",
    name: "Chloé",
    jobTitle: "Assistante Agenda",
    icon: Calendar,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    skills: ["Prise de rendez-vous", "Gestion des disponibilités", "Rappels amicaux"],
    systemPrompt: "Tu es Chloé, une assistante de direction virtuelle experte en gestion d'agenda. Ton rôle est de faciliter la prise de rendez-vous pour les clients. Règle n°1 : Sois concise et claire sur les disponibilités. Règle n°2 : Demande toujours confirmation avant de bloquer un créneau. Règle n°3 : Ne propose pas plus de deux options de date/heure à la fois pour ne pas surcharger le client."
  },
  {
    id: "legal",
    name: "Julia",
    jobTitle: "Assistante Juridique",
    icon: Settings2,
    color: "text-slate-500",
    bgColor: "bg-slate-500/10",
    skills: ["Rédaction de contrats", "Conformité RGPD", "Analyse juridique de premier niveau"],
    systemPrompt: "Tu es Julia, une assistante juridique virtuelle spécialisée en droit des affaires et RGPD. Ton rôle est de rédiger des documents légaux (CGV, NDA, contrats) et d'apporter des conseils de conformité. Règle n°1 : Utilise un ton formel, précis et professionnel. Règle n°2 : Rappelle toujours que tu n'es pas une avocate inscrite au barreau et que tes conseils ne remplacent pas une consultation officielle. Règle n°3 : Sois intransigeante sur la protection des données."
  },
  {
    id: "accounting",
    name: "Manue",
    jobTitle: "Assistante Comptable",
    icon: CheckCircle2,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    skills: ["Analyse financière", "Gestion des relances", "Production de rapports"],
    systemPrompt: "Tu es Manue, une assistante comptable rigoureuse et organisée. Ton rôle est d'aider le client à suivre sa trésorerie, de préparer la facturation et d'effectuer les relances clients. Règle n°1 : Sois extrêmement précise avec les chiffres. Règle n°2 : Utilise un ton courtois mais ferme pour les scénarios de relance d'impayés. Règle n°3 : Suggère toujours de fournir une preuve comptable ou un reçu."
  },
  {
    id: "recruitment",
    name: "Rony",
    jobTitle: "Expert Recrutement",
    icon: MessageCircle,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    skills: ["Tri de CV", "Qualification des candidats", "Rédaction d'offres d'emploi"],
    systemPrompt: "Tu es Rony, un recruteur talentueux et bienveillant. Ton rôle est d'aider l'entreprise à rédiger des fiches de poste attractives et d'analyser les profils des candidats. Règle n°1 : Sois constructif dans tes retours d'évaluation. Règle n°2 : Rédige des offres d'emploi centrées sur la culture d'entreprise et les avantages. Règle n°3 : Prépare des questions d'entretien pertinentes basées sur les compétences requises."
  },
  {
    id: "facebook_manager",
    name: "Zuck",
    jobTitle: "Manager Facebook",
    icon: Sparkles,
    color: "text-blue-600",
    bgColor: "bg-blue-600/10",
    skills: ["Création de posts engageants", "Réponse aux commentaires", "Croissance de la communauté"],
    systemPrompt: "Tu es un Community Manager spécialisé sur Facebook. Ton rôle est de créer du contenu engageant et de répondre aux commentaires de la page. Règle n°1 : Utilise un ton dynamique et interactif. Règle n°2 : Incite toujours à l'engagement (questions, sondages).",
    roleType: "FACEBOOK_MANAGER"
  },
  {
    id: "linkedin_manager",
    name: "Reid",
    jobTitle: "Manager LinkedIn",
    icon: Briefcase,
    color: "text-sky-600",
    bgColor: "bg-sky-600/10",
    skills: ["Thought Leadership", "Réseautage B2B", "Contenu expert"],
    systemPrompt: "Tu es un Social Media Manager spécialisé sur LinkedIn. Ton rôle est de positionner l'entreprise ou la personne comme un expert dans son domaine. Règle n°1 : Utilise un ton professionnel, inspirant et axé sur la valeur ajoutée. Règle n°2 : Structure tes posts avec des retours à la ligne marqués.",
    roleType: "LINKEDIN_MANAGER"
  },
  {
    id: "tiktok_manager",
    name: "Byte",
    jobTitle: "Manager TikTok",
    icon: MessageSquare,
    color: "text-zinc-800",
    bgColor: "bg-zinc-800/10",
    skills: ["Scripts vidéos", "Réponse aux commentaires", "Tendances virales"],
    systemPrompt: "Tu es un Créateur de Contenu spécialisé sur TikTok. Ton rôle est de rédiger des scripts vidéos viraux et de modérer les commentaires. Règle n°1 : Sois ultra-créatif, jeune et branché. Règle n°2 : Utilise l'humour et les références à la pop culture.",
    roleType: "TIKTOK_MANAGER"
  }
];

export default function AITeamClient({ initialEmployees, phoneNumbers, whatsappAccounts }: any) {
  const router = useRouter();
  const [employees, setEmployees] = useState(initialEmployees);
  const [view, setView] = useState<'list' | 'catalog' | 'configure'>('list');
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [selectedEmployeeForKB, setSelectedEmployeeForKB] = useState<any>(null);
  const [selectedEmployeeForSkills, setSelectedEmployeeForSkills] = useState<any>(null);
  const [dbTemplates, setDbTemplates] = useState<any[]>(AI_TEMPLATES);

  useEffect(() => {
    fetch('/api/god-mode/templates')
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data) && data.length > 0) setDbTemplates(data);
      })
      .catch(e => console.error("Error fetching templates", e));
  }, []);

  const [formData, setFormData] = useState({
    name: "",
    jobTitle: "",
    systemPrompt: "",
    templateId: "",
    selectedTone: "",
    voiceId: "alloy",
    handlesWhatsApp: false,
    handlesVoice: false,
    roleType: "GENERAL",
  });

  const handleSelectTemplate = (template: any) => {
    setSelectedTemplate(template);
    let parsedTones = [];
    try {
      parsedTones = typeof template.tones === 'string' ? JSON.parse(template.tones) : (template.tones || []);
    } catch(e){}

    setFormData({
      ...formData,
      name: template.name,
      jobTitle: template.jobTitle,
      systemPrompt: template.systemPrompt || "",
      roleType: template.roleType || "GENERAL",
      templateId: template.id || "",
      selectedTone: parsedTones.length > 0 ? parsedTones[0].name : ""
    });
    setView('configure');
  };

  const handleConnectSocial = async (provider: string, employeeId: string) => {
    try {
      const toastId = toast.loading(`Connexion à ${provider}...`);
      const res = await fetch(`/api/social/auth/${provider.toLowerCase()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiEmployeeId: employeeId })
      });
      if (!res.ok) throw new Error("Échec de la connexion");
      toast.success(`Compte ${provider} connecté avec succès !`, { id: toastId });
      router.refresh();
    } catch (error) {
      toast.error(`Erreur lors de la connexion à ${provider}`);
    }
  };

  const handleCreate = async () => {
    try {
      const toastId = toast.loading("Recrutement en cours...");
      const res = await fetch("/api/ai-employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error("Failed to create AI employee");
      const newEmp = await res.json();
      setEmployees([newEmp, ...employees]);
      toast.success("Agent recruté avec succès !", { id: toastId });
      setView('list');
      setFormData({
        name: "",
        jobTitle: "",
        systemPrompt: "",
        templateId: "",
        selectedTone: "",
        voiceId: "alloy",
        handlesWhatsApp: false,
        handlesVoice: false,
        roleType: "GENERAL",
      });
      router.refresh();
    } catch (error) {
      toast.error("Erreur lors de la création");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            {view === 'list' && `Membres de l'équipe (${employees.length})`}
            {view === 'catalog' && "Catalogue d'Agents IA"}
            {view === 'configure' && "Configuration de l'Agent"}
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {view === 'list' && "Gérez vos employés virtuels actuels."}
            {view === 'catalog' && "Choisissez un profil adapté à vos besoins."}
            {view === 'configure' && "Personnalisez les paramètres de votre agent."}
          </p>
        </div>

        <div className="flex gap-3">
          {view === 'list' && (
            <button 
              onClick={() => setView('catalog')}
              className="flex items-center gap-2 bg-[var(--accent-primary)] text-[var(--accent-foreground)] px-4 py-2 rounded-xl font-medium shadow-sm hover:opacity-90 transition-opacity"
            >
              <Plus className="w-5 h-5" />
              Recruter un agent
            </button>
          )}
          
          {view !== 'list' && (
            <button 
              onClick={() => setView('list')}
              className="flex items-center gap-2 bg-[var(--bg-base)] text-[var(--text-secondary)] px-4 py-2 rounded-xl font-medium hover:text-[var(--text-primary)] transition-opacity border border-[var(--border-subtle)]"
            >
              Retour à l'équipe
            </button>
          )}
        </div>
      </div>

      {/* VIEW: CATALOG */}
      {view === 'catalog' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {dbTemplates.map((template) => {
            const Icon = template.icon;
            return (
              <div key={template.id} className="glass-panel p-6 rounded-3xl border border-[var(--border-subtle)] hover:border-[var(--accent-primary)]/50 transition-all group flex flex-col h-full">
                <div className={`w-14 h-14 rounded-2xl ${template.bgColor} ${template.color} flex items-center justify-center mb-4`}>
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-xl text-[var(--text-primary)]">{template.name}</h3>
                <p className="text-sm font-medium text-[var(--accent-primary)] mb-4">{template.jobTitle}</p>
                
                <div className="space-y-2 mb-6 flex-grow">
                  <p className="text-xs text-[var(--text-secondary)] font-semibold uppercase tracking-wider mb-2">Compétences</p>
                  {(() => {
                    let skills: string[] = [];
                    try { skills = typeof template.skills === 'string' ? JSON.parse(template.skills) : (template.skills || []); } catch(e){}
                    return skills.map((skill, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm text-[var(--text-primary)]">
                        <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${template.color}`} />
                        <span>{skill}</span>
                      </div>
                    ));
                  })()}
                </div>

                <button 
                  onClick={() => handleSelectTemplate(template)}
                  className="w-full py-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-medium group-hover:bg-[var(--accent-primary)] group-hover:text-[var(--accent-foreground)] group-hover:border-[var(--accent-primary)] transition-all"
                >
                  Recruter ce profil
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW: CONFIGURE */}
      {view === 'configure' && (
        <div className="glass-panel p-6 rounded-3xl border border-[var(--border-subtle)] animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-[var(--border-subtle)]">
            <div className={`w-16 h-16 rounded-2xl ${selectedTemplate?.bgColor} ${selectedTemplate?.color} flex items-center justify-center`}>
              {selectedTemplate && <selectedTemplate.icon className="w-8 h-8" />}
            </div>
            <div>
              <h3 className="font-bold text-2xl text-[var(--text-primary)]">Finaliser le recrutement</h3>
              <p className="text-[var(--text-secondary)]">Personnalisez votre agent et assignez-lui des canaux de communication.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Nom de l'employé</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)] transition-all outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Rôle / Poste</label>
              <input 
                type="text" 
                value={formData.jobTitle}
                onChange={e => setFormData({...formData, jobTitle: e.target.value})}
                className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)] transition-all outline-none"
              />
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2 flex items-center gap-2">
              <Brain className="w-4 h-4" /> Comportement & Ton (Âme de l'IA)
            </label>
            {(() => {
              let tones: any[] = [];
              try { tones = typeof selectedTemplate?.tones === 'string' ? JSON.parse(selectedTemplate.tones) : (selectedTemplate?.tones || []); } catch(e){}
              
              if (tones.length > 0) {
                return (
                  <select 
                    value={formData.selectedTone}
                    onChange={e => setFormData({...formData, selectedTone: e.target.value})}
                    className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)] transition-all outline-none"
                  >
                    {tones.map((t: any, idx: number) => (
                      <option key={idx} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                );
              } else {
                return (
                  <div className="p-4 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl text-sm text-[var(--text-secondary)] italic">
                    Le comportement de cet agent est verrouillé par l'Administrateur pour garantir une efficacité maximale.
                  </div>
                );
              }
            })()}
            <p className="text-xs text-[var(--text-secondary)] mt-2">Choisissez l'approche comportementale de votre agent face à vos clients.</p>
          </div>

          <div className="mb-8">
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-4">Canaux de communication autorisés</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className={`flex flex-col gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${formData.handlesWhatsApp ? 'border-green-500 bg-green-500/5' : 'border-[var(--border-subtle)] hover:border-[var(--text-secondary)]'}`}>
                <div className="flex justify-between items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${formData.handlesWhatsApp ? 'bg-green-500 text-white' : 'bg-[var(--bg-base)] text-[var(--text-secondary)]'}`}>
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <input type="checkbox" checked={formData.handlesWhatsApp} onChange={e => setFormData({...formData, handlesWhatsApp: e.target.checked})} className="w-5 h-5 rounded border-[var(--border-subtle)] text-green-500 focus:ring-green-500" />
                </div>
                <span className={`font-medium ${formData.handlesWhatsApp ? 'text-green-600 dark:text-green-400' : 'text-[var(--text-primary)]'}`}>WhatsApp</span>
              </label>

              <label className={`flex flex-col gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${formData.handlesVoice ? 'border-blue-500 bg-blue-500/5' : 'border-[var(--border-subtle)] hover:border-[var(--text-secondary)]'}`}>
                <div className="flex justify-between items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${formData.handlesVoice ? 'bg-blue-500 text-white' : 'bg-[var(--bg-base)] text-[var(--text-secondary)]'}`}>
                    <Phone className="w-5 h-5" />
                  </div>
                  <input type="checkbox" checked={formData.handlesVoice} onChange={e => setFormData({...formData, handlesVoice: e.target.checked})} className="w-5 h-5 rounded border-[var(--border-subtle)] text-blue-500 focus:ring-blue-500" />
                </div>
                <span className={`font-medium ${formData.handlesVoice ? 'text-blue-600 dark:text-blue-400' : 'text-[var(--text-primary)]'}`}>Appels Vocaux</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-6 border-t border-[var(--border-subtle)] justify-end">
            <button onClick={() => setView('catalog')} className="px-6 py-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium">Annuler</button>
            <button onClick={handleCreate} className="bg-[var(--accent-primary)] text-[var(--accent-foreground)] px-8 py-3 rounded-xl font-medium flex items-center gap-2 hover:shadow-lg hover:shadow-[var(--accent-primary)]/20 transition-all">
              <Sparkles className="w-5 h-5" />
              Confirmer le recrutement
            </button>
          </div>
        </div>
      )}

      {/* VIEW: LIST */}
      {view === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {employees.map((emp: any) => (
            <div key={emp.id} className="glass-panel p-6 rounded-3xl border border-[var(--border-subtle)] relative group">
              <div className="flex gap-4 items-start">
                <div className="w-14 h-14 rounded-2xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] flex items-center justify-center shrink-0">
                  <Bot className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-[var(--text-primary)]">{emp.name}</h3>
                  <p className="text-sm font-medium text-[var(--accent-primary)] flex items-center gap-1 mt-1">
                    <Briefcase className="w-4 h-4" />
                    {emp.jobTitle}
                  </p>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] block mb-2">Canaux & Intégrations</span>
                  
                  {emp.roleType === 'FACEBOOK_MANAGER' ? (
                    <button onClick={() => handleConnectSocial('FACEBOOK', emp.id)} className="w-full mt-2 bg-[#1877F2] text-white py-2 rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                      Connecter Facebook
                    </button>
                  ) : emp.roleType === 'LINKEDIN_MANAGER' ? (
                    <button onClick={() => handleConnectSocial('LINKEDIN', emp.id)} className="w-full mt-2 bg-[#0A66C2] text-white py-2 rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                      Connecter LinkedIn
                    </button>
                  ) : emp.roleType === 'TIKTOK_MANAGER' ? (
                    <button onClick={() => handleConnectSocial('TIKTOK', emp.id)} className="w-full mt-2 bg-black text-white py-2 rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>
                      Connecter TikTok
                    </button>
                  ) : (
                    <div className="flex gap-2 text-[var(--text-primary)]">
                      {emp.handlesWhatsApp && <div className="bg-green-500/10 text-green-500 p-2 rounded-xl" title="WhatsApp"><MessageCircle className="w-5 h-5" /></div>}
                      {emp.handlesVoice && <div className="bg-blue-500/10 text-blue-500 p-2 rounded-xl" title="Appels"><Phone className="w-5 h-5" /></div>}
                      {!emp.handlesWhatsApp && !emp.handlesVoice && <span className="text-sm text-[var(--text-secondary)] italic">Aucun canal assigné</span>}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between text-sm pt-4 border-t border-[var(--border-subtle)]">
                  <span className="text-[var(--text-secondary)] font-medium">Statut</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${emp.isActive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                    {emp.isActive ? 'En poste' : 'Inactif'}
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[var(--border-subtle)] flex justify-between items-center">
                <button 
                  onClick={() => setSelectedEmployeeForKB(emp)}
                  className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)] hover:text-purple-500 transition-colors bg-[var(--bg-surface-hover)] px-3 py-1.5 rounded-lg border border-[var(--border-subtle)]"
                >
                  <Brain className="w-4 h-4 text-purple-500" />
                  Mémoire / Savoir
                </button>
                <button 
                  onClick={() => setSelectedEmployeeForSkills(emp)}
                  className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)] hover:text-violet-500 transition-colors bg-[var(--bg-surface-hover)] px-3 py-1.5 rounded-lg border border-[var(--border-subtle)]"
                >
                  <Wrench className="w-4 h-4 text-violet-500" />
                  Skills
                </button>
                <div className="flex gap-2">
                  <button className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors">
                    <Settings2 className="w-4 h-4" />
                    Configurer
                  </button>
                  <button className="text-[var(--text-secondary)] hover:text-red-500 transition-colors bg-red-500/5 hover:bg-red-500/10 p-2 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {employees.length === 0 && (
            <div className="col-span-full py-16 text-center border-2 border-dashed border-[var(--border-subtle)] rounded-[2rem] bg-[var(--bg-base)]/50">
              <div className="w-20 h-20 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Construisez votre équipe idéale</h3>
              <p className="text-[var(--text-secondary)] max-w-md mx-auto mb-8 text-lg">
                Déléguez votre support, vos ventes et votre secrétariat à des agents IA ultra-compétents.
              </p>
              <button 
                onClick={() => setView('catalog')}
                className="bg-[var(--accent-primary)] text-[var(--accent-foreground)] px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-xl hover:shadow-[var(--accent-primary)]/20 transition-all inline-flex items-center gap-3 hover:-translate-y-1"
              >
                Découvrir le catalogue d'agents
                <ArrowLeft className="w-5 h-5 rotate-180" />
              </button>
            </div>
          )}
        </div>
      )}

      {selectedEmployeeForKB && (
        <KnowledgeBaseModal 
          employeeId={selectedEmployeeForKB.id}
          employeeName={selectedEmployeeForKB.name}
          onClose={() => setSelectedEmployeeForKB(null)} 
        />
      )}

      {selectedEmployeeForSkills && (
        <SkillsModal 
          employeeId={selectedEmployeeForSkills.id}
          employeeName={selectedEmployeeForSkills.name}
          onClose={() => setSelectedEmployeeForSkills(null)}
        />
      )}
    </div>
  );
}
