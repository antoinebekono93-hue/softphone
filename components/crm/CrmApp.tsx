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
  const [showNewModal, setShowNewModal] = useState(false);
  const [newModalStage, setNewModalStage] = useState("NEW");
  const [newOppName, setNewOppName] = useState("");
  const [newOppRevenue, setNewOppRevenue] = useState(1000);

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

  const openNewOpportunityModal = (stage: string = "NEW") => {
    setNewModalStage(stage);
    setNewOppName("");
    setNewOppRevenue(1000);
    setShowNewModal(true);
  };

  const submitNewOpportunity = async () => {
    if (!newOppName.trim()) return alert("Le nom est requis");
    setShowNewModal(false);
    setIsLoading(true);
    try {
      const res = await fetch('/api/crm/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newOppName,
          expectedRevenue: newOppRevenue,
          stage: newModalStage,
          priority: 1
        })
      });
      if (res.ok) {
        await fetchOpportunities();
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
            <button onClick={() => openNewOpportunityModal("NEW")} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-sm font-bold shadow-md shadow-blue-500/20 transition-all">
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
            onRefresh={fetchOpportunities}
          />
        ) : (
          <KanbanBoard 
            opportunities={opportunities} 
            onRecordClick={(id) => setSelectedRecordId(id)}
            onUpdateOpportunities={setOpportunities}
            onAddOpportunity={openNewOpportunityModal}
          />
        )}
      </div>

      {/* Modal Nouvelle Opportunité */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Créer une opportunité</h2>
              <p className="text-sm text-gray-500 mt-1">Étape: {newModalStage}</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Nom de l'opportunité</label>
                <input 
                  type="text" 
                  value={newOppName}
                  onChange={e => setNewOppName(e.target.value)}
                  placeholder="Ex: Contrat ABC"
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Revenu Espéré (€)</label>
                <input 
                  type="number" 
                  value={newOppRevenue}
                  onChange={e => setNewOppRevenue(Number(e.target.value))}
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="p-6 bg-gray-50 flex justify-end gap-3">
              <button 
                onClick={() => setShowNewModal(false)} 
                className="px-5 py-2.5 rounded-xl text-gray-600 font-bold hover:bg-gray-200 transition-colors"
              >
                Annuler
              </button>
              <button 
                onClick={submitNewOpportunity} 
                className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/20"
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
