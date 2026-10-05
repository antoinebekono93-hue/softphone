"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useOnline } from "@/hooks/useOnline";
import { ArrowLeft, WifiOff, RefreshCw, MessageSquare } from "lucide-react";
import { draftKey, readSnapshot } from "@/lib/offline-store";
type Contact = { id: string; name: string; phone: string; lastMessage?: { body: string } | null };
type Message = { id: string; body: string; direction: string; sentAt: string };
export default function OfflinePage() {
  const { data: session, status } = useSession();
  const online = useOnline();
  const sessionScope = session?.user?.id && session.user.organizationId ? session.user.organizationId + ":" + session.user.id : "";
  const [scope, setScope] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selected, setSelected] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    if (online && status === "loading") return;
    let cancelled = false;
    async function load() {
      try {
        const owner = localStorage.getItem("antigravity-storage-owner");
        if (!owner || (online && owner !== sessionScope)) return;
        const snapshot = await readSnapshot<Contact[]>(owner, "contacts");
        if (!cancelled && snapshot) {
          setScope(owner); setContacts(snapshot.value); setSavedAt(snapshot.savedAt);
        }
      } finally { if (!cancelled) setLoading(false); }
    }
    void load().catch(() => { if (!cancelled) setError("Le stockage local est indisponible."); });
    return () => { cancelled = true; };
  }, [online, status, sessionScope]);
  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    setMessages([]);
    try { setDraft(localStorage.getItem(draftKey(scope, selected.id, "shared")) || ""); }
    catch { setError("Le stockage local est indisponible."); }
    void readSnapshot<Message[]>(scope, "messages:" + selected.id).then(snapshot => {
      if (!cancelled) {
        setMessages(snapshot?.value || []);
        setSavedAt(snapshot?.savedAt || null);
      }
    });
    return () => { cancelled = true; };
  }, [selected, scope]);
  useEffect(() => {
    function clear() {
      setContacts([]); setMessages([]); setSelected(null); setDraft(""); setScope(""); setSavedAt(null);
    }
    function storage(event: StorageEvent) {
      if (event.key === "antigravity-storage-owner" && event.newValue !== scope) clear();
    }
    window.addEventListener("antigravity-private-cleared", clear);
    window.addEventListener("storage", storage);
    return () => {
      window.removeEventListener("antigravity-private-cleared", clear);
      window.removeEventListener("storage", storage);
    };
  }, [scope]);
  function saveDraft(text: string) {
    setDraft(text);
    if (!selected || !scope) return;
    try {
      const key = draftKey(scope, selected.id, "shared");
      if (text) localStorage.setItem(key, text);
      else localStorage.removeItem(key);
    } catch { setError("Brouillon non enregistré : le stockage de cet appareil est indisponible."); }
  }
  return <main className="h-dvh flex flex-col max-w-2xl mx-auto bg-[var(--bg-base)] safe-top safe-bottom">
    <header className="shrink-0 p-4 border-b border-[var(--border-subtle)] space-y-3">
      <div className="flex items-center gap-2 text-[var(--warning)] text-sm"><WifiOff className="h-4 w-4" /> Version hors connexion</div>
      <div className="flex items-center gap-3">
        {selected && <button onClick={() => setSelected(null)} aria-label="Retour aux discussions" className="min-h-11 min-w-11 grid place-items-center rounded-xl bg-[var(--bg-surface)]"><ArrowLeft className="h-5 w-5" /></button>}
        <h1 className="text-xl font-semibold flex-1">{selected?.name || "Discussions enregistrées"}</h1>
      </div>
      <p className="text-xs text-[var(--text-secondary)]">{savedAt ? "Copie du " + new Date(savedAt).toLocaleString("fr-FR") : "Seules les conversations récemment consultées sont disponibles."}</p>
      <button onClick={() => window.location.assign(selected ? "/dashboard/inbox?contact=" + encodeURIComponent(selected.id) : "/dashboard/inbox")} className="min-h-11 flex items-center gap-2 text-sm text-[var(--brand)]"><RefreshCw className="h-4 w-4" /> Reprendre en ligne</button>
    </header>
    {error && <p role="alert" className="p-3 text-sm text-[var(--danger)]">{error}</p>}
    <section className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4">
      {loading ? <p role="status">Chargement des données locales…</p> : selected ? <>
        {messages.length === 0 && <p className="text-sm text-[var(--text-secondary)]">Aucun message enregistré pour cette conversation.</p>}
        {messages.map(message => <div key={message.id} className={"flex mb-3 " + (message.direction === "OUTBOUND" ? "justify-end" : "justify-start")}>
          <div className="max-w-[88%] p-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
            <p className="whitespace-pre-wrap break-words">{message.body}</p>
            <time className="block mt-1 text-xs text-[var(--text-secondary)]">{new Date(message.sentAt).toLocaleString("fr-FR")}</time>
          </div>
        </div>)}
      </> : contacts.length ? contacts.map(contact => <button key={contact.id} onClick={() => setSelected(contact)} className="w-full flex items-center gap-3 py-4 text-left border-b border-[var(--border-subtle)]">
        <MessageSquare className="h-5 w-5 text-[var(--brand)] shrink-0" /><span className="min-w-0"><span className="block font-medium">{contact.name || contact.phone}</span><span className="block truncate text-sm text-[var(--text-secondary)]">{contact.lastMessage?.body || contact.phone}</span></span>
      </button>) : <p className="text-[var(--text-secondary)]">Ouvrez vos discussions une première fois avec une connexion pour les retrouver ici. Vos brouillons déjà enregistrés restent sur cet appareil.</p>}
    </section>
    {selected && <footer className="shrink-0 p-4 border-t border-[var(--border-subtle)]">
      <label htmlFor="offline-draft" className="block text-sm font-medium mb-2">Préparer un brouillon</label>
      <textarea id="offline-draft" value={draft} onChange={e => saveDraft(e.target.value)} rows={3} className="w-full rounded-xl p-3 text-base resize-none" />
      <p className="mt-2 text-xs text-[var(--text-secondary)]">Brouillon local. Retrouvez-le en ligne pour l’envoyer.</p>
    </footer>}
  </main>;
}
