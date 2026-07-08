"use client";

import { useState, useEffect } from "react";
import { X, Upload, Link as LinkIcon, FileText, Trash2, Loader2, Brain } from "lucide-react";
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
      
      toast.success("Document ajouté avec succès !");
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
      
      toast.success("Contenu extrait et ajouté avec succès !");
      setUrlInput("");
      fetchDocuments();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsScraping(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce document ? Il sera retiré de la mémoire des agents IA.")) return;
    
    try {
      const res = await fetch(`/api/knowledge/documents?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Erreur lors de la suppression");
      
      toast.success("Document supprimé");
      setDocuments(documents.filter(d => d.id !== id));
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-3xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] flex items-center justify-center">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Base de Connaissances</h2>
              <p className="text-sm text-[var(--text-secondary)]">
                Mémoire dédiée pour {employeeName || "cet agent"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-8 flex-1">
          {/* Add URL */}
          <div className="space-y-3">
            <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <LinkIcon className="w-4 h-4" /> Ajouter une URL (Scraping)
            </h3>
            <div className="flex gap-3">
              <input 
                type="text" 
                placeholder="https://maboutique.com/faq"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                className="flex-1 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-4 py-2.5 text-[var(--text-primary)]"
              />
              <button 
                onClick={handleUrlScrape}
                disabled={isScraping || !urlInput}
                className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] px-6 py-2.5 rounded-xl font-medium hover:bg-[var(--bg-base)] disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {isScraping && <Loader2 className="w-4 h-4 animate-spin" />}
                Extraire
              </button>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">Le texte visible sur la page sera extrait et ajouté à la mémoire.</p>
          </div>

          {/* Upload File */}
          <div className="space-y-3">
            <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <Upload className="w-4 h-4" /> Uploader un Document
            </h3>
            <div className="relative border-2 border-dashed border-[var(--border-subtle)] rounded-2xl p-8 text-center hover:bg-[var(--bg-elevated)] transition-colors">
              <input 
                type="file" 
                accept=".pdf,.txt,.docx,.md" 
                onChange={handleFileUpload}
                disabled={isUploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              {isUploading ? (
                <div className="flex flex-col items-center gap-2 text-[var(--text-primary)]">
                  <Loader2 className="w-6 h-6 animate-spin text-[var(--accent-primary)]" />
                  <p className="font-medium">Traitement en cours (OpenAI)...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <FileText className="w-8 h-8 text-[var(--text-secondary)]" />
                  <p className="font-medium text-[var(--text-primary)]">Cliquez ou glissez un fichier ici</p>
                  <p className="text-xs text-[var(--text-secondary)]">Supporte: PDF, TXT, DOCX (Max 25MB)</p>
                </div>
              )}
            </div>
          </div>

          {/* Document List */}
          <div className="space-y-4">
            <h3 className="font-semibold text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-2">
              Documents en Mémoire ({documents.length})
            </h3>
            
            {isLoading ? (
              <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-[var(--text-secondary)]" /></div>
            ) : documents.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)] text-center py-4 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-subtle)]">
                La base de connaissances est vide. L'IA utilisera uniquement ses instructions de base.
              </p>
            ) : (
              <ul className="space-y-3">
                {documents.map(doc => (
                  <li key={doc.id} className="flex items-center justify-between p-3 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl group">
                    <div className="flex items-center gap-3 overflow-hidden">
                      {doc.type === 'URL' ? <LinkIcon className="w-5 h-5 text-blue-500 shrink-0" /> : <FileText className="w-5 h-5 text-purple-500 shrink-0" />}
                      <div className="truncate">
                        <p className="font-medium text-sm text-[var(--text-primary)] truncate">{doc.name}</p>
                        <p className="text-xs text-[var(--text-secondary)]">Ajouté le {new Date(doc.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDelete(doc.id)}
                      className="p-2 text-[var(--text-secondary)] opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
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
