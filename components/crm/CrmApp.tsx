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
    <div className="h-full flex flex-col relative overflow-hidden bg-white p-8">
      {/* Odoo-style Topbar */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-4">
        <div className="flex items-center gap-2 text-gray-900">
          <button 
            onClick={() => setSelectedRecordId(null)}
            className="text-2xl font-extrabold hover:text-blue-600 transition-colors tracking-tight"
          >
            Pipeline
          </button>
          
          {selectedOpportunity && (
            <>
              <span className="text-gray-400 font-light text-2xl">/</span>
              <span className="text-2xl font-bold text-gray-600 tracking-tight">{selectedOpportunity.name}</span>
            </>
          )}
        </div>
        
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 shadow-sm rounded-lg text-sm font-bold text-gray-700 transition-colors">
            Filtres
          </button>
          {!selectedRecordId && (
            <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-sm font-bold shadow-md shadow-blue-500/20 transition-all">
              + Nouvelle Opportunité
            </button>
          )}
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 overflow-hidden relative">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-gray-500 font-medium">Chargement...</div>
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
