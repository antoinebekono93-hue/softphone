"use client";

import { useState, useMemo, useRef } from "react";
import { Search, Plus, X, Loader2, Building, Mail, Phone, Trash2, Folder, Download, Upload, Users } from "lucide-react";
import Link from "next/link";
import { createContact, updateContact, deleteContact, createContactGroup, deleteContactGroup, importContacts } from "./actions";
import Papa from "papaparse";

export function ContactsClient({ initialContacts, initialGroups }: { initialContacts: any[], initialGroups: any[] }) {
  const [contacts, setContacts] = useState(initialContacts);
  const [groups, setGroups] = useState(initialGroups);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Group Modal
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [isSavingGroup, setIsSavingGroup] = useState(false);

  // Import State
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    notes: ""
  });

  const filteredContacts = useMemo(() => {
    let result = contacts;
    
    // Filter by group
    if (selectedGroupId) {
      result = result.filter((c: any) => c.groups?.some((g: any) => g.id === selectedGroupId));
    }

    if (!searchQuery) return result;
    const q = searchQuery.toLowerCase();
    return result.filter((c: any) => 
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.phone && c.phone.includes(q)) ||
      (c.company && c.company.toLowerCase().includes(q))
    );
  }, [contacts, searchQuery, selectedGroupId]);

  const openModal = (contact: any = null) => {
    setSelectedContact(contact);
    if (contact) {
      setFormData({
        name: contact.name || "",
        company: contact.company || "",
        email: contact.email || "",
        phone: contact.phone || "",
        notes: contact.notes || ""
      });
    } else {
      setFormData({
        name: "",
        company: "",
        email: "",
        phone: "",
        notes: ""
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    if (selectedContact) {
      const res = await updateContact(selectedContact.id, formData, selectedGroupId || undefined);
      if (res.success && res.contact) {
        setContacts(contacts.map(c => c.id === selectedContact.id ? res.contact : c));
        setIsModalOpen(false);
      } else {
        alert(res.error || "An error occurred");
      }
    } else {
      const res = await createContact(formData, selectedGroupId || undefined);
      if (res.success && res.contact) {
        setContacts([...contacts, res.contact].sort((a: any, b: any) => (a.name || "").localeCompare(b.name || "")));
        setIsModalOpen(false);
      } else {
        alert(res.error || "An error occurred");
      }
    }
    setIsSaving(false);
  };

  const handleDelete = async () => {
    if (!selectedContact || !confirm("Êtes-vous sûr de vouloir supprimer ce contact ?")) return;
    setIsDeleting(true);
    const res = await deleteContact(selectedContact.id);
    if (res.success) {
      setContacts(contacts.filter(c => c.id !== selectedContact.id));
      setIsModalOpen(false);
    } else {
      alert(res.error || "An error occurred");
    }
    setIsDeleting(false);
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName) return;
    setIsSavingGroup(true);
    const res = await createContactGroup({ name: newGroupName });
    if (res.success && res.group) {
      setGroups([...groups, res.group].sort((a: any, b: any) => a.name.localeCompare(b.name)));
      setIsGroupModalOpen(false);
      setNewGroupName("");
      setSelectedGroupId(res.group.id);
    } else {
      alert(res.error || "Failed to create group");
    }
    setIsSavingGroup(false);
  };

  const handleDeleteGroup = async (id: string) => {
    if (!confirm("Voulez-vous supprimer ce groupe ? Les contacts ne seront pas supprimés.")) return;
    const res = await deleteContactGroup(id);
    if (res.success) {
      setGroups(groups.filter(g => g.id !== id));
      if (selectedGroupId === id) setSelectedGroupId(null);
    } else {
      alert(res.error || "Error");
    }
  };

  const handleExportCSV = () => {
    if (filteredContacts.length === 0) return alert("Aucun contact à exporter");
    const data = filteredContacts.map((c: any) => ({
      Name: c.name || "",
      Phone: c.phone || "",
      Email: c.email || "",
      Company: c.company || "",
      Notes: c.notes || ""
    }));
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `contacts_${selectedGroupId ? groups.find(g => g.id === selectedGroupId)?.name : "tous"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const parsed = results.data.map((row: any) => ({
          name: row.Name || row.name || row.Nom || "",
          phone: row.Phone || row.phone || row.Telephone || row['Téléphone'] || "",
          email: row.Email || row.email || "",
          company: row.Company || row.company || row.Entreprise || "",
          notes: row.Notes || row.notes || ""
        })).filter((r: any) => r.phone); // Phone is required

        if (parsed.length === 0) {
          alert("Aucun contact valide trouvé. Assurez-vous d'avoir une colonne 'Phone'.");
          setIsImporting(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
        }

        const res = await importContacts(parsed, selectedGroupId || undefined);
        if (res.success) {
          alert(`${res.importedCount} contacts importés avec succès ! Rafraîchissez la page pour voir les modifications complètes.`);
          window.location.reload();
        } else {
          alert(res.error || "Erreur lors de l'importation");
        }
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      },
      error: () => {
        alert("Erreur de lecture du fichier CSV");
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    });
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full h-full flex flex-col md:flex-row gap-6">
      
      {/* Sidebar for Groups */}
      <div className="w-full md:w-64 shrink-0 flex flex-col gap-4">
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Groupes</h2>
        
        <button 
          onClick={() => setIsGroupModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors w-full shadow-sm"
        >
          <Plus className="w-4 h-4" /> Créer un groupe
        </button>

        <div className="flex flex-col gap-1 mt-2">
          <button
            onClick={() => setSelectedGroupId(null)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${!selectedGroupId ? 'bg-[var(--bg-surface)] text-[var(--accent-cyan)] font-medium shadow-sm border border-[var(--border-subtle)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]'}`}
          >
            <Users className="w-4 h-4" /> Tous les contacts
          </button>
          
          {groups.map(g => (
            <div key={g.id} className={`group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${selectedGroupId === g.id ? 'bg-[var(--bg-surface)] text-[var(--accent-cyan)] font-medium shadow-sm border border-[var(--border-subtle)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]'}`}>
              <button
                onClick={() => setSelectedGroupId(g.id)}
                className="flex items-center gap-3 flex-1 text-left"
              >
                <Folder className="w-4 h-4" /> {g.name}
              </button>
              <button 
                onClick={() => handleDeleteGroup(g.id)}
                className="opacity-0 group-hover:opacity-100 text-[var(--text-secondary)] hover:text-var(--danger) transition-opacity"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-500" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)] flex items-center gap-3">
              {selectedGroupId ? groups.find(g => g.id === selectedGroupId)?.name : "Tous les contacts"}
            </h1>
            <p className="text-[var(--text-secondary)] text-sm mt-1">
              {filteredContacts.length} contact(s) dans cette vue
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <input 
              type="file" 
              accept=".csv" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleImportCSV} 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors flex items-center gap-2 shadow-sm"
            >
              {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Importer CSV
            </button>
            <button 
              onClick={handleExportCSV}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors flex items-center gap-2 shadow-sm"
            >
              <Download className="w-4 h-4" /> Exporter
            </button>
            <button 
              onClick={() => openModal()}
              className="btn-primary-gradient flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Ajouter
            </button>
          </div>
        </div>

        <div className="glass-panel overflow-hidden flex-1 flex flex-col">
          <div className="p-4 border-b border-[var(--border-subtle)] flex items-center gap-3 shrink-0">
             <Search className="w-5 h-5 text-[var(--text-secondary)]" />
             <input 
               type="text"
               placeholder="Rechercher par nom, entreprise ou téléphone..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="bg-transparent border-none outline-none w-full text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
             />
          </div>
          
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
                  <th className="p-4 text-xs font-semibold uppercase text-[var(--text-secondary)]">Nom</th>
                  <th className="p-4 text-xs font-semibold uppercase text-[var(--text-secondary)]">Entreprise</th>
                  <th className="p-4 text-xs font-semibold uppercase text-[var(--text-secondary)]">Téléphone</th>
                  <th className="p-4 text-xs font-semibold uppercase text-[var(--text-secondary)] hidden lg:table-cell">Email</th>
                  <th className="p-4 text-xs font-semibold uppercase text-[var(--text-secondary)]">Score IA</th>
                  <th className="p-4 text-xs font-semibold uppercase text-[var(--text-secondary)]">Sentiment</th>
                  <th className="p-4 text-xs font-semibold uppercase text-[var(--text-secondary)] text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredContacts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-[var(--text-secondary)]">
                      Aucun contact trouvé dans cette vue.
                    </td>
                  </tr>
                ) : (
                  filteredContacts.map((contact: any) => (
                    <tr key={contact.id} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)] transition-colors">
                      <td className="p-4">
                        <div className="font-semibold text-[var(--text-primary)]">
                          {contact.name || "Sans nom"}
                        </div>
                      </td>
                      <td className="p-4 text-sm text-[var(--text-secondary)]">
                        {contact.company ? (
                          <div className="flex items-center gap-1.5">
                            <Building className="w-3.5 h-3.5" /> {contact.company}
                          </div>
                        ) : "-"}
                      </td>
                      <td className="p-4 text-sm font-medium text-[var(--text-primary)]">
                        <div className="flex items-center gap-1.5">
                           <Phone className="w-3.5 h-3.5 text-[var(--text-secondary)]" /> {contact.phone}
                        </div>
                      </td>
                      <td className="p-4 text-sm text-[var(--text-secondary)] hidden lg:table-cell">
                        {contact.email ? (
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5" /> {contact.email}
                          </div>
                        ) : "-"}
                      </td>
                      <td className="p-4">
                        {contact.leadScore !== null ? (
                          <span className={`px-2 py-1 text-xs font-bold rounded-full ${contact.leadScore >= 70 ? 'bg-rose-500/10 text-rose-500' : contact.leadScore >= 40 ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'}`}>
                            {contact.leadScore >= 70 ? '🔥 Chaud' : contact.leadScore >= 40 ? '⭐ Tiède' : '❄️ Froid'} ({contact.leadScore})
                          </span>
                        ) : "-"}
                      </td>
                      <td className="p-4">
                        {contact.sentiment ? (
                          <span className={`px-2 py-1 text-xs font-bold rounded-full ${contact.sentiment === 'POSITIVE' ? 'bg-emerald-500/10 text-emerald-500' : contact.sentiment === 'NEGATIVE' ? 'bg-red-500/10 text-red-500' : 'bg-gray-500/10 text-gray-400'}`}>
                            {contact.sentiment === 'POSITIVE' ? 'Positif 😊' : contact.sentiment === 'NEGATIVE' ? 'Négatif 😠' : 'Neutre 😐'}
                          </span>
                        ) : "-"}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => openModal(contact)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors shadow-sm"
                          >
                            Modifier
                          </button>
                          <Link 
                            href={`/dashboard/contacts/${contact.id}`}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 transition-colors shadow-sm"
                          >
                            Profil
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Contact Form Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-[var(--border-subtle)] flex items-center justify-between shrink-0">
                <h2 className="text-xl font-bold text-[var(--text-primary)]">
                   {selectedContact ? "Modifier Contact" : "Nouveau Contact"}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                <form id="contact-form" onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-[var(--text-secondary)]">Nom complet</label>
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-cyan)] focus:ring-1 focus:ring-[var(--accent-cyan)] transition-colors"
                      placeholder="Ex: Jean Dupont"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-[var(--text-secondary)]">Numéro de téléphone *</label>
                    <input 
                      type="tel" 
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-cyan)] focus:ring-1 focus:ring-[var(--accent-cyan)] transition-colors"
                      placeholder="Ex: +33612345678"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-[var(--text-secondary)]">Entreprise</label>
                    <input 
                      type="text" 
                      value={formData.company}
                      onChange={(e) => setFormData({...formData, company: e.target.value})}
                      className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-cyan)] focus:ring-1 focus:ring-[var(--accent-cyan)] transition-colors"
                      placeholder="Ex: Acme Corp"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-[var(--text-secondary)]">Email</label>
                    <input 
                      type="email" 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-cyan)] focus:ring-1 focus:ring-[var(--accent-cyan)] transition-colors"
                      placeholder="Ex: jean@acme.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-[var(--text-secondary)]">Notes</label>
                    <textarea 
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-cyan)] focus:ring-1 focus:ring-[var(--accent-cyan)] transition-colors min-h-[100px] resize-none"
                      placeholder="Notes internes concernant ce contact..."
                    />
                  </div>
                </form>
              </div>
              <div className="p-6 border-t border-[var(--border-subtle)] flex justify-between items-center shrink-0 bg-[var(--bg-surface)]">
                {selectedContact ? (
                   <button 
                     type="button"
                     onClick={handleDelete}
                     disabled={isDeleting || isSaving}
                     className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors"
                   >
                      {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      Supprimer
                   </button>
                ) : <div></div>}
  
                <div className="flex gap-3">
                  <button 
                     type="button"
                     onClick={() => setIsModalOpen(false)} 
                     className="px-4 py-2 rounded-xl text-sm font-semibold border border-[var(--border-subtle)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors bg-[var(--bg-surface)]"
                  >
                    Annuler
                  </button>
                  <button 
                     type="submit"
                     form="contact-form"
                     disabled={isSaving || isDeleting} 
                     className="btn-primary-gradient min-w-[100px] flex justify-center items-center"
                  >
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Enregistrer"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Group Creation Modal */}
        {isGroupModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-[var(--border-subtle)] flex items-center justify-between">
                <h2 className="text-xl font-bold text-[var(--text-primary)]">Nouveau Groupe</h2>
                <button onClick={() => setIsGroupModalOpen(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreateGroup}>
                <div className="p-6">
                  <label className="block text-sm font-semibold mb-2 text-[var(--text-secondary)]">Nom du groupe</label>
                  <input 
                    type="text" 
                    required
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-cyan)] focus:ring-1 focus:ring-[var(--accent-cyan)] transition-colors"
                    placeholder="Ex: VIP, Prospects..."
                  />
                </div>
                <div className="p-6 border-t border-[var(--border-subtle)] flex justify-end gap-3 bg-[var(--bg-surface)]">
                  <button 
                     type="button"
                     onClick={() => setIsGroupModalOpen(false)} 
                     className="px-4 py-2 rounded-xl text-sm font-semibold border border-[var(--border-subtle)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors bg-[var(--bg-surface)]"
                  >
                    Annuler
                  </button>
                  <button 
                     type="submit"
                     disabled={isSavingGroup || !newGroupName.trim()} 
                     className="btn-primary-gradient flex items-center justify-center min-w-[100px]"
                  >
                    {isSavingGroup ? <Loader2 className="w-4 h-4 animate-spin" /> : "Créer"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
