"use client";

import { useState, useEffect } from "react";
import { X, Upload, Link as LinkIcon, FileText, Trash2, Loader2, Brain, Globe, Database, Sparkles } from "lucide-react";
import toast from "react-hot-toast";

export default function KnowledgeBaseModal({ onClose, employeeId, employeeName }: { onClose: () => void, employeeId: string, employeeName?: string }) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [isScraping, setIsScraping] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`/api/knowledge/documents?employeeId=${employeeId}`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    // Quick validation
    if (file.size > 25 * 1024 * 1024) {
      toast.error("Le fichier ne doit pas dépasser 25MB");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("employeeId", employeeId);

    try {
      const res = await fetch("/api/knowledge/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erreur lors de l'upload");
      }
      
      toast.success("Document ajouté au cerveau de l'IA !");
      fetchDocuments();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsUploading(false);
      e.target.value = ''; // Reset input
    }
  };

  const handleUrlScrape = async () => {
    if (!urlInput || !urlInput.startsWith('http')) {
      toast.error("Veuillez entrer une URL valide (http/https)");
      return;
    }

    setIsScraping(true);
    try {
      const res = await fetch("/api/knowledge/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlInput, employeeId }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erreur lors de l'extraction");
      }
      
      toast.success("Page web mémorisée avec succès !");
      setUrlInput("");
      fetchDocuments();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsScraping(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce document ? L'IA l'oubliera instantanément.")) return;
    
    try {
      const res = await fetch(`/api/knowledge/documents?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Erreur lors de la suppression");
      
      toast.success("Document oublié");
      setDocuments(documents.filter(d => d.id !== id));
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
      <div className="bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-3xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] shadow-[0_0_50px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-300">
        
        {/* Header Ultra-Premium */}
        <div className="flex justify-between items-center p-6 border-b border-[var(--border-subtle)] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent-primary)]/5 to-purple-500/5" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[var(--accent-primary)] to-purple-500 p-[1px] shadow-lg shadow-[var(--accent-primary)]/20">
              <div className="w-full h-full rounded-2xl bg-[var(--bg-base)] flex items-center justify-center">
                <Brain className="w-6 h-6 text-[var(--accent-primary)]" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-[var(--text-primary)] to-[var(--text-secondary)] bg-clip-text text-transparent flex items-center gap-2">
                Base de Connaissances <Sparkles className="w-5 h-5 text-purple-400" />
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                Mémoire sémantique pour <span className="text-[var(--text-primary)] font-medium">{employeeName || "cet agent"}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="relative z-10 p-2 text-[var(--text-secondary)] hover:text-red-400 hover:bg-red-400/10 rounded-full transition-all duration-200">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto space-y-10 flex-1 bg-gradient-to-b from-[var(--bg-base)] to-[var(--bg-elevated)]">
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Scrape URL */}
            <div className="space-y-4">
              <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2 text-lg">
                <Globe className="w-5 h-5 text-blue-500" /> Ajouter une Page Web
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">Le texte visible sera extrait et ajouté à la mémoire vectorielle.</p>
              <div className="flex flex-col gap-3">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LinkIcon className="w-4 h-4 text-[var(--text-secondary)] group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input 
                    type="text" 
                    placeholder="https://maboutique.com/faq"
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl pl-10 pr-4 py-3 text-[var(--text-primary)] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all shadow-inner"
                  />
                </div>
                <button 
                  onClick={handleUrlScrape}
                  disabled={isScraping || !urlInput}
                  className="bg-blue-500/10 text-blue-500 border border-blue-500/20 px-6 py-3 rounded-xl font-medium hover:bg-blue-500 hover:text-white disabled:opacity-50 disabled:hover:bg-blue-500/10 disabled:hover:text-blue-500 transition-all duration-300 flex items-center justify-center gap-2 shadow-sm"
                >
                  {isScraping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Database className="w-5 h-5" />}
                  {isScraping ? "Extraction..." : "Mémoriser l'URL"}
                </button>
              </div>
            </div>

            {/* Upload File */}
            <div className="space-y-4">
              <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5 text-purple-500" /> Uploader un Document
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">PDF, TXT, DOCX pour un apprentissage approfondi.</p>
              
              <div className="relative group border-2 border-dashed border-[var(--border-subtle)] hover:border-purple-500/50 rounded-2xl p-6 text-center bg-[var(--bg-base)] hover:bg-purple-500/5 transition-all duration-300 h-[120px] flex items-center justify-center overflow-hidden">
                <input 
                  type="file" 
                  accept=".pdf,.txt,.docx,.md" 
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                />
                
                {isUploading ? (
                  <div className="flex flex-col items-center gap-2 text-[var(--text-primary)]">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                    <p className="font-medium animate-pulse">Vectorisation en cours...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 transform group-hover:-translate-y-1 transition-transform duration-300">
                    <div className="w-12 h-12 rounded-full bg-[var(--bg-elevated)] group-hover:bg-purple-500/10 flex items-center justify-center transition-colors">
                      <Upload className="w-6 h-6 text-[var(--text-secondary)] group-hover:text-purple-500 transition-colors" />
                    </div>
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">Glissez ou cliquez</p>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">Max 25MB par fichier</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-[var(--border-subtle)] to-transparent" />

          {/* Document List */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[var(--text-primary)] text-lg flex items-center gap-2">
                <Database className="w-5 h-5 text-[var(--text-secondary)]" /> 
                Documents en Mémoire
              </h3>
              <span className="bg-[var(--bg-elevated)] px-3 py-1 rounded-full text-xs font-medium text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                {documents.length} fichier{documents.length !== 1 ? 's' : ''}
              </span>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-primary)]" />
              </div>
            ) : documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 bg-[var(--bg-base)] rounded-2xl border border-[var(--border-subtle)] border-dashed">
                <Brain className="w-12 h-12 text-[var(--text-secondary)] opacity-20 mb-4" />
                <p className="text-[var(--text-primary)] font-medium">La mémoire est vierge</p>
                <p className="text-sm text-[var(--text-secondary)] text-center mt-2 max-w-sm">
                  Uploadez des fichiers ou extrayez des pages web pour rendre cette IA plus intelligente sur vos produits.
                </p>
              </div>
            ) : (
              <ul className="grid sm:grid-cols-2 gap-4">
                {documents.map(doc => (
                  <li key={doc.id} className="flex items-center justify-between p-4 bg-[var(--bg-base)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--accent-primary)]/30 rounded-2xl group transition-all duration-300 hover:shadow-md hover:-translate-y-1">
                    <div className="flex items-center gap-4 overflow-hidden">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${doc.type === 'URL' ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'}`}>
                        {doc.type === 'URL' ? <Globe className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                      </div>
                      <div className="truncate">
                        <p className="font-medium text-[var(--text-primary)] truncate">{doc.name}</p>
                        <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1 mt-0.5">
                          {doc.type === 'URL' ? 'Lien Web' : 'Fichier'} • {new Date(doc.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDelete(doc.id)}
                      className="p-2.5 text-[var(--text-secondary)] opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all duration-200 shrink-0"
                      title="Supprimer de la mémoire"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
