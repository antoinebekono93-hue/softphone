"use client";

import { useState, useEffect } from "react";

interface ChatterProps {
  opportunityId: string;
}

type FeedItem = {
  id: string;
  type: 'note' | 'whatsapp_in' | 'whatsapp_out' | 'call';
  author: string;
  time: string;
  content: string;
};

export default function Chatter({ opportunityId }: ChatterProps) {
  const [activeTab, setActiveTab] = useState<"note" | "whatsapp" | "email">("note");
  const [inputValue, setInputValue] = useState("");
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchFeed = async () => {
    try {
      const res = await fetch(`/api/crm/opportunities/${opportunityId}/chatter`);
      if (res.ok) {
        const data = await res.json();
        setFeed(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
    // Optional: add a polling interval here if we want realtime-ish feel
    // const interval = setInterval(fetchFeed, 5000);
    // return () => clearInterval(interval);
  }, [opportunityId]);

  const handleSubmit = async () => {
    if (!inputValue.trim()) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/crm/opportunities/${opportunityId}/chatter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: activeTab, content: inputValue })
      });

      if (res.ok) {
        setInputValue("");
        await fetchFeed(); // Refresh the feed to show the new item
      } else {
        const error = await res.text();
        alert(`Erreur: ${error}`);
      }
    } catch (e) {
      console.error(e);
      alert("Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      
      {/* Input Box Area */}
      <div className="bg-white border-b border-gray-200 shadow-sm z-10">
        <div className="flex border-b border-gray-100">
          <button 
            onClick={() => setActiveTab("note")}
            className={`flex-1 py-3 text-sm font-bold transition-all ${activeTab === "note" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}
          >
            Log Note
          </button>
          <button 
            onClick={() => setActiveTab("whatsapp")}
            className={`flex-1 py-3 text-sm font-bold transition-all ${activeTab === "whatsapp" ? "text-emerald-600 border-b-2 border-emerald-600" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}
          >
            WhatsApp
          </button>
          <button 
            onClick={() => setActiveTab("email")}
            className={`flex-1 py-3 text-sm font-bold transition-all ${activeTab === "email" ? "text-gray-900 border-b-2 border-gray-900" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}
          >
            Email
          </button>
        </div>
        
        <div className="p-4">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={
              activeTab === "note" ? "Enregistrez une note interne (visible uniquement par vous)..." : 
              activeTab === "whatsapp" ? "Rédigez un message WhatsApp au client..." : 
              "Rédigez un email..."
            }
            className={`w-full bg-gray-50 border rounded-xl p-3 text-sm text-gray-900 resize-none focus:outline-none focus:ring-2 transition-all shadow-inner ${
              activeTab === "whatsapp" ? "border-emerald-200 focus:ring-emerald-500/20 focus:border-emerald-500" : "border-gray-200 focus:ring-blue-500/20 focus:border-blue-500"
            }`}
            rows={3}
            disabled={isSubmitting}
          ></textarea>
          
          <div className="flex justify-between items-center mt-3">
            <div className="flex gap-2 text-gray-400">
              <button className="hover:text-gray-600 transition-colors bg-white hover:bg-gray-50 p-1.5 rounded-lg border border-transparent hover:border-gray-200" title="Attacher un fichier"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg></button>
              <button className="hover:text-gray-600 transition-colors bg-white hover:bg-gray-50 p-1.5 rounded-lg border border-transparent hover:border-gray-200" title="Mentionner"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"></circle><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"></path></svg></button>
            </div>
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`px-5 py-2 rounded-xl text-sm font-bold text-white transition-all shadow-md ${
                activeTab === "whatsapp" ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20" : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20"
              } ${isSubmitting ? "opacity-50 cursor-not-allowed" : "hover:-translate-y-0.5"}`}
            >
              {isSubmitting ? "Envoi..." : (activeTab === "note" ? "Enregistrer" : "Envoyer")}
            </button>
          </div>
        </div>
      </div>

      {/* History Stream */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
        {isLoading ? (
          <div className="text-center text-gray-500 text-sm mt-4 font-medium">Chargement de l'historique...</div>
        ) : feed.length === 0 ? (
          <div className="text-center text-gray-500 text-sm mt-4 font-medium">Aucune activité récente.</div>
        ) : (
          feed.map((item) => (
            <div key={item.id} className="flex gap-4">
              <div className="mt-1 shrink-0">
                {item.type === "note" && <div className="w-8 h-8 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center text-gray-600 shadow-sm"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></div>}
                {item.type === "whatsapp_in" && <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-sm"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg></div>}
                {item.type === "whatsapp_out" && <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-sm"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"></path><path d="M22 2l-7 20-4-9-9-4 20-7z"></path></svg></div>}
                {item.type === "call" && <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-600 shadow-sm"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg></div>}
              </div>
              
              <div className={`flex-1 bg-white border border-gray-200 rounded-2xl p-4 shadow-sm ${item.type.includes('whatsapp') ? "border-emerald-200 bg-emerald-50/30" : ""}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-gray-900">{item.author}</span>
                  <span className="text-xs font-medium text-gray-500">
                    {new Date(item.time).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {item.content}
                </p>
              </div>
            </div>
          ))
        )}

        {!isLoading && feed.length > 0 && (
          <div className="flex items-center gap-4 pt-4">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Fin de l'historique</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>
        )}

      </div>
    </div>
  );
}
