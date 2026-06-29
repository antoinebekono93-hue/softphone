"use client";

import { useState } from "react";

interface ChatterProps {
  opportunityId: string;
}

export default function Chatter({ opportunityId }: ChatterProps) {
  const [activeTab, setActiveTab] = useState<"note" | "whatsapp" | "email">("note");
  const [inputValue, setInputValue] = useState("");

  // Odoo style chatter : mixed history by default
  const history = [
    {
      id: 1,
      type: "note",
      author: "Antoine Bekono",
      time: "Il y a 2 heures",
      content: "J'ai préparé le devis, il faut qu'on le valide en interne demain.",
    },
    {
      id: 2,
      type: "whatsapp_in",
      author: "Client",
      time: "Hier, 14:30",
      content: "Bonjour, avez-vous pu avancer sur la proposition ?",
    },
    {
      id: 3,
      type: "call",
      author: "Antoine Bekono",
      time: "Il y a 2 jours",
      content: "Appel sortant (Telnyx) - 14 minutes. Résumé IA: Le client est très intéressé, budget OK.",
    }
  ];

  return (
    <div className="h-full flex flex-col bg-[#111118]">
      
      {/* Input Box Area */}
      <div className="bg-[#181822] border-b border-white/10">
        <div className="flex border-b border-white/5">
          <button 
            onClick={() => setActiveTab("note")}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === "note" ? "text-cyan-400 border-b-2 border-cyan-400" : "text-gray-500 hover:text-gray-300"}`}
          >
            Log Note
          </button>
          <button 
            onClick={() => setActiveTab("whatsapp")}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === "whatsapp" ? "text-emerald-400 border-b-2 border-emerald-400" : "text-gray-500 hover:text-gray-300"}`}
          >
            WhatsApp
          </button>
          <button 
            onClick={() => setActiveTab("email")}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === "email" ? "text-white border-b-2 border-white" : "text-gray-500 hover:text-gray-300"}`}
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
            className={`w-full bg-black/30 border rounded-xl p-3 text-sm text-white resize-none focus:outline-none focus:ring-1 transition-all ${
              activeTab === "whatsapp" ? "border-emerald-500/30 focus:ring-emerald-500" : "border-white/10 focus:ring-cyan-500"
            }`}
            rows={3}
          ></textarea>
          
          <div className="flex justify-between items-center mt-3">
            <div className="flex gap-2 text-gray-500">
              <button className="hover:text-white" title="Attacher un fichier"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg></button>
              <button className="hover:text-white" title="Mentionner"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"></circle><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"></path></svg></button>
            </div>
            <button className={`px-4 py-1.5 rounded-lg text-sm font-bold text-white transition-colors ${
              activeTab === "whatsapp" ? "bg-emerald-600 hover:bg-emerald-500" : "bg-cyan-600 hover:bg-cyan-500"
            }`}>
              {activeTab === "note" ? "Enregistrer" : "Envoyer"}
            </button>
          </div>
        </div>
      </div>

      {/* History Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-white/10"></div>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Aujourd'hui</span>
          <div className="flex-1 h-px bg-white/10"></div>
        </div>

        {history.map((item) => (
          <div key={item.id} className="flex gap-3">
            <div className="mt-1">
              {item.type === "note" && <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></div>}
              {item.type === "whatsapp_in" && <div className="w-8 h-8 rounded-full bg-emerald-900/50 flex items-center justify-center text-emerald-400"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg></div>}
              {item.type === "call" && <div className="w-8 h-8 rounded-full bg-cyan-900/50 flex items-center justify-center text-cyan-400"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg></div>}
            </div>
            
            <div className={`flex-1 bg-white/[0.03] border border-white/5 rounded-2xl p-3 ${item.type === "whatsapp_in" ? "border-emerald-500/20 bg-emerald-900/10" : ""}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold text-gray-200">{item.author}</span>
                <span className="text-xs text-gray-500">{item.time}</span>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">
                {item.content}
              </p>
            </div>
          </div>
        ))}

        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-white/10"></div>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Création de l'opportunité</span>
          <div className="flex-1 h-px bg-white/10"></div>
        </div>

      </div>
    </div>
  );
}
