"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
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
          <Button variant="secondary">Filtres</Button>
          {!selectedRecordId && (
            <Button variant="gradient" onClick={() => openNewOpportunityModal("NEW")}>
              + Nouvelle Opportunité
            </Button>
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

      <Modal
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="Créer une opportunité"
        description={`Étape: ${newModalStage}`}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowNewModal(false)}>Annuler</Button>
            <Button onClick={submitNewOpportunity}>Créer</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Nom de l'opportunité</label>
            <Input
              type="text"
              value={newOppName}
              onChange={(e) => setNewOppName(e.target.value)}
              placeholder="Ex: Contrat ABC"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Revenu Espéré (€)</label>
            <Input
              type="number"
              value={newOppRevenue}
              onChange={(e) => setNewOppRevenue(Number(e.target.value))}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
