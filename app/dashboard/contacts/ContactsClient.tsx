"use client";

import { useState, useMemo } from "react";
import { Search, Plus, Edit2, X, Loader2, Building, Mail, Phone, Trash2 } from "lucide-react";
import { createContact, updateContact, deleteContact } from "./actions";

export function ContactsClient({ initialContacts }: { initialContacts: any[] }) {
  const [contacts, setContacts] = useState(initialContacts);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    notes: ""
  });

  const filteredContacts = useMemo(() => {
    if (!searchQuery) return contacts;
    const q = searchQuery.toLowerCase();
    return contacts.filter((c: any) => 
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.phone && c.phone.includes(q)) ||
      (c.company && c.company.toLowerCase().includes(q))
    );
  }, [contacts, searchQuery]);

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
      const res = await updateContact(selectedContact.id, formData);
      if (res.success && res.contact) {
        setContacts(contacts.map(c => c.id === selectedContact.id ? res.contact : c));
        setIsModalOpen(false);
      } else {
        alert(res.error || "An error occurred");
      }
    } else {
      const res = await createContact(formData);
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
    if (!selectedContact || !confirm("Are you sure you want to delete this contact?")) return;
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

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 text-[var(--text-primary)]">
            Contacts
          </h1>
          <p className="text-[var(--text-secondary)] text-sm md:text-base">
            Manage your customer address book.
          </p>
        </div>
        <button 
          onClick={() => openModal()}
          className="apple-btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Contact
        </button>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="p-4 border-b border-[var(--border-subtle)] flex items-center gap-3">
           <Search className="w-5 h-5 text-[var(--text-secondary)]" />
           <input 
             type="text"
             placeholder="Search by name, company, or phone..."
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="bg-transparent border-none outline-none w-full text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
           />
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface-hover)]">
              <th className="p-4 text-xs font-semibold uppercase text-[var(--text-secondary)]">Name</th>
              <th className="p-4 text-xs font-semibold uppercase text-[var(--text-secondary)]">Company</th>
              <th className="p-4 text-xs font-semibold uppercase text-[var(--text-secondary)]">Phone</th>
              <th className="p-4 text-xs font-semibold uppercase text-[var(--text-secondary)] hidden md:table-cell">Email</th>
              <th className="p-4 text-xs font-semibold uppercase text-[var(--text-secondary)] text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredContacts.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-[var(--text-secondary)]">
                  No contacts found.
                </td>
              </tr>
            ) : (
              filteredContacts.map((contact: any) => (
                <tr key={contact.id} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)] transition-colors">
                  <td className="p-4">
                    <div className="font-semibold text-[var(--text-primary)]">
                      {contact.name || "Unnamed Contact"}
                    </div>
                  </td>
                  <td className="p-4 text-sm text-[var(--text-secondary)]">
                    {contact.company ? (
                      <div className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5" /> {contact.company}
                      </div>
                    ) : "-"}
                  </td>
                  <td className="p-4 text-sm font-medium">
                    <div className="flex items-center gap-1.5">
                       <Phone className="w-3.5 h-3.5 text-[var(--text-secondary)]" /> {contact.phone}
                    </div>
                  </td>
                  <td className="p-4 text-sm text-[var(--text-secondary)] hidden md:table-cell">
                    {contact.email ? (
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5" /> {contact.email}
                      </div>
                    ) : "-"}
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => openModal(contact)}
                      className="apple-btn bg-transparent border border-[var(--border-subtle)] px-3 py-1.5 text-xs"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-[var(--border-subtle)] flex items-center justify-between shrink-0">
              <h2 className="text-xl font-bold">
                 {selectedContact ? "Edit Contact" : "New Contact"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <form id="contact-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Full Name</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="apple-input"
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Phone Number *</label>
                  <input 
                    type="tel" 
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="apple-input"
                    placeholder="e.g. +1234567890"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Company</label>
                  <input 
                    type="text" 
                    value={formData.company}
                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                    className="apple-input"
                    placeholder="e.g. Acme Corp"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Email</label>
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="apple-input"
                    placeholder="e.g. john@acme.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Notes</label>
                  <textarea 
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="apple-input min-h-[100px] resize-none"
                    placeholder="Internal notes about this contact..."
                  />
                </div>
              </form>
            </div>
            <div className="p-6 border-t border-[var(--border-subtle)] flex justify-between items-center shrink-0">
              {selectedContact ? (
                 <button 
                   type="button"
                   onClick={handleDelete}
                   disabled={isDeleting || isSaving}
                   className="apple-btn bg-transparent border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 flex items-center gap-2"
                 >
                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    Delete
                 </button>
              ) : <div></div>}

              <div className="flex gap-3">
                <button 
                   type="button"
                   onClick={() => setIsModalOpen(false)} 
                   className="apple-btn bg-transparent border border-[var(--border-subtle)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]"
                >
                  Cancel
                </button>
                <button 
                   type="submit"
                   form="contact-form"
                   disabled={isSaving || isDeleting} 
                   className="apple-btn btn-primary min-w-[100px]"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
