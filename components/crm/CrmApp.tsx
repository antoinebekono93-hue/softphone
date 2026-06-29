"use client";

import { useState, useEffect } from "react";
import KanbanBoard from "./KanbanBoard";
import RecordView from "./RecordView";

export type Opportunity = {
  id: string;
  name: string;
  company?: string;
  contactId?: string;
  contact?: { name: string; phone: string; organizationId: string };
  expectedRevenue: number;
  priority: number;
  stage: string;
};

export default function CrmApp() {
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOpportunities = async () => {
    try {
      const res = await fetch('/api/crm/opportunities');
      if (res.ok) {
        const data = await res.json();
        // Map DB fields to our UI fields
        const mapped = data.map((d: any) => ({
          ...d,
          company: d.contact?.name || "Client Inconnu",
        }));
        setOpportunities(mapped);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const selectedOpportunity = opportunities.find(o => o.id === selectedRecordId);

  return (
    <div className="h-full flex flex-col relative overflow-hidden bg-[#0a0a0f]">
      {/* Odoo-style Topbar */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
        <div className="flex items-center gap-2 text-white">
          <button 
            onClick={() => setSelectedRecordId(null)}
            className="text-xl font-bold hover:text-cyan-400 transition-colors"
          >
            Pipeline
          </button>
          
          {selectedOpportunity && (
            <>
              <span className="text-gray-500">/</span>
              <span className="text-xl font-medium text-gray-300">{selectedOpportunity.name}</span>
            </>
          )}
        </div>
        
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium text-white transition-colors">
            Filtres
          </button>
          {!selectedRecordId && (
            <button className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-cyan-500/20 transition-colors">
              + Nouvelle Opportunité
            </button>
          )}
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 overflow-hidden relative">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-white">Chargement...</div>
        ) : selectedRecordId && selectedOpportunity ? (
          <RecordView 
            opportunity={selectedOpportunity} 
            onClose={() => setSelectedRecordId(null)} 
          />
        ) : (
          <KanbanBoard 
            opportunities={opportunities} 
            onRecordClick={(id) => setSelectedRecordId(id)}
            onUpdateOpportunities={setOpportunities}
          />
        )}
      </div>
    </div>
  );
}
