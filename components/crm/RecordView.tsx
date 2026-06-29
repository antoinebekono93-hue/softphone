"use client";

import { Opportunity } from "./CrmApp";
import Chatter from "./Chatter";

interface RecordViewProps {
  opportunity: Opportunity;
  onClose: () => void;
  onRefresh: () => void;
}

export default function RecordView({ opportunity, onClose, onRefresh }: RecordViewProps) {
  const STAGES = ["NEW", "QUALIFIED", "PROPOSITION", "WON"];
  const currentStageIndex = STAGES.indexOf(opportunity.stage);

  const updateStage = async (stage: string) => {
    try {
      const res = await fetch(`/api/crm/opportunities/${opportunity.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage })
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (error) {
      console.error('Failed to update stage', error);
    }
  };

  return (
    <div className="h-full flex gap-6">
      
      {/* Left Pane : Record Data (Form View) */}
      <div className="flex-1 bg-white border border-gray-200 rounded-2xl flex flex-col overflow-hidden shadow-sm">
        
        {/* Record Header - Status Bar */}
        <div className="bg-gray-50/80 p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex gap-2">
            <button onClick={() => updateStage("WON")} className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-sm transition-colors shadow-sm shadow-emerald-500/20">
              Gagné
            </button>
            <button onClick={() => updateStage("LOST")} className="px-4 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded font-bold text-sm transition-colors shadow-sm">
              Perdu
            </button>
          </div>
          
          {/* Status Pipeline Visual (Chevron style like Odoo) */}
          <div className="flex bg-white rounded-full border border-gray-200 p-1 overflow-hidden shadow-sm">
            {STAGES.map((stage, idx) => {
              const isActive = idx === currentStageIndex;
              const isPast = idx < currentStageIndex;
              return (
                <div 
                  key={stage} 
                  className={`px-4 py-1 text-xs font-bold uppercase tracking-wider rounded-full transition-colors ${
                    isActive ? "bg-blue-600 text-white shadow-sm" : 
                    isPast ? "text-blue-600" : "text-gray-400"
                  }`}
                >
                  {stage}
                </div>
              );
            })}
          </div>
        </div>

        {/* Record Body (Fields) */}
        <div className="p-8 overflow-y-auto">
          {/* Title and Prob */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">{opportunity.name}</h2>
              <div className="text-gray-500 flex items-center gap-2 font-medium">
                Revenu Espéré: 
                <span className="text-xl font-bold text-emerald-600">
                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(opportunity.expectedRevenue)}
                </span>
              </div>
            </div>
            
            {/* Priority Stars */}
            <div className="flex gap-1 text-gray-300 cursor-pointer">
              {[1, 2, 3].map(star => (
                <svg key={star} className={`w-7 h-7 ${star <= opportunity.priority ? 'text-amber-400 fill-amber-400' : 'hover:text-gray-400'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
              ))}
            </div>
          </div>

          {/* Form Grid */}
          <div className="grid grid-cols-2 gap-x-12 gap-y-6">
            <div className="flex border-b border-gray-100 pb-3">
              <label className="w-1/3 text-sm font-bold text-gray-500">Client</label>
              <div className="w-2/3 text-sm text-blue-600 font-bold hover:underline cursor-pointer">
                {opportunity.company}
              </div>
            </div>
            
            <div className="flex border-b border-gray-100 pb-3">
              <label className="w-1/3 text-sm font-bold text-gray-500">Email</label>
              <div className="w-2/3 text-sm text-gray-900 font-medium">contact@example.com</div>
            </div>

            <div className="flex border-b border-gray-100 pb-3">
              <label className="w-1/3 text-sm font-bold text-gray-500">Téléphone</label>
              <div className="w-2/3 text-sm text-gray-900 font-medium flex items-center gap-2">
                +33 6 12 34 56 78
                <button className="text-blue-500 hover:text-blue-600 bg-blue-50 p-1 rounded-md" title="Appeler via le Softphone">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                </button>
              </div>
            </div>

            <div className="flex border-b border-gray-100 pb-3">
              <label className="w-1/3 text-sm font-bold text-gray-500">Vendeur</label>
              <div className="w-2/3 text-sm text-gray-900 font-medium flex items-center gap-2">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=Antoine`} className="w-6 h-6 rounded-full bg-gray-100" alt="Avatar" />
                Antoine Bekono
              </div>
            </div>
            
            <div className="flex border-b border-gray-100 pb-3 col-span-2">
              <label className="w-1/6 text-sm font-bold text-gray-500">Tags</label>
              <div className="w-5/6 flex gap-2">
                <span className="px-2 py-1 bg-purple-50 text-purple-700 font-bold border border-purple-100 text-xs rounded-md">Produit A</span>
                <span className="px-2 py-1 bg-emerald-50 text-emerald-700 font-bold border border-emerald-100 text-xs rounded-md">VIP</span>
              </div>
            </div>

            <div className="col-span-2 pt-4">
              <label className="block text-sm font-bold text-gray-500 mb-2">Notes internes de l'opportunité</label>
              <div className="w-full h-32 bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-700 font-medium shadow-inner">
                Le client a un budget validé pour Q3. Il attend une proposition détaillée sur la sécurité des serveurs.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Pane : Chatter (Activity Stream) */}
      <div className="w-[450px] bg-white border border-gray-200 rounded-2xl flex flex-col overflow-hidden shadow-sm">
        <Chatter opportunityId={opportunity.id} />
      </div>

    </div>
  );
}
