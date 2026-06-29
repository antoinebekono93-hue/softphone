"use client";

import { Opportunity } from "./CrmApp";
import Chatter from "./Chatter";

interface RecordViewProps {
  opportunity: Opportunity;
  onClose: () => void;
}

export default function RecordView({ opportunity, onClose }: RecordViewProps) {
  const STAGES = ["NEW", "QUALIFIED", "PROPOSITION", "WON"];
  const currentStageIndex = STAGES.indexOf(opportunity.stage);

  return (
    <div className="h-full flex gap-6">
      
      {/* Left Pane : Record Data (Form View) */}
      <div className="flex-1 bg-[#111118] border border-white/10 rounded-2xl flex flex-col overflow-hidden shadow-xl shadow-black/50">
        
        {/* Record Header - Status Bar */}
        <div className="bg-[#181822] p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex gap-2">
            <button className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-medium text-sm transition-colors">
              Gagné
            </button>
            <button className="px-4 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 rounded font-medium text-sm transition-colors">
              Perdu
            </button>
          </div>
          
          {/* Status Pipeline Visual (Chevron style like Odoo) */}
          <div className="flex bg-black/40 rounded-full border border-white/5 p-1 overflow-hidden">
            {STAGES.map((stage, idx) => {
              const isActive = idx === currentStageIndex;
              const isPast = idx < currentStageIndex;
              return (
                <div 
                  key={stage} 
                  className={`px-4 py-1 text-xs font-bold uppercase tracking-wider rounded-full transition-colors ${
                    isActive ? "bg-cyan-500 text-white shadow-md shadow-cyan-500/20" : 
                    isPast ? "text-cyan-400" : "text-gray-600"
                  }`}
                >
                  {stage}
                </div>
              );
            })}
          </div>
        </div>

        {/* Record Body (Fields) */}
        <div className="p-6 overflow-y-auto">
          {/* Title and Prob */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-2xl font-extrabold text-white mb-1">{opportunity.name}</h2>
              <div className="text-gray-400 flex items-center gap-2">
                Revenu Espéré: 
                <span className="text-xl font-bold text-emerald-400">
                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(opportunity.expectedRevenue)}
                </span>
              </div>
            </div>
            
            {/* Priority Stars */}
            <div className="flex gap-1 text-gray-600 cursor-pointer">
              {[1, 2, 3].map(star => (
                <svg key={star} className={`w-6 h-6 ${star <= opportunity.priority ? 'text-amber-400 fill-amber-400' : 'hover:text-gray-400'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
              ))}
            </div>
          </div>

          {/* Form Grid */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-6">
            <div className="flex border-b border-white/5 pb-2">
              <label className="w-1/3 text-sm font-semibold text-gray-500">Client</label>
              <div className="w-2/3 text-sm text-cyan-400 font-medium hover:underline cursor-pointer">
                {opportunity.company}
              </div>
            </div>
            
            <div className="flex border-b border-white/5 pb-2">
              <label className="w-1/3 text-sm font-semibold text-gray-500">Email</label>
              <div className="w-2/3 text-sm text-white">contact@example.com</div>
            </div>

            <div className="flex border-b border-white/5 pb-2">
              <label className="w-1/3 text-sm font-semibold text-gray-500">Téléphone</label>
              <div className="w-2/3 text-sm text-white flex items-center gap-2">
                +33 6 12 34 56 78
                <button className="text-cyan-500 hover:text-cyan-400" title="Appeler via le Softphone">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                </button>
              </div>
            </div>

            <div className="flex border-b border-white/5 pb-2">
              <label className="w-1/3 text-sm font-semibold text-gray-500">Vendeur</label>
              <div className="w-2/3 text-sm text-white flex items-center gap-2">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=Antoine`} className="w-5 h-5 rounded-full bg-white/10" alt="Avatar" />
                Antoine Bekono
              </div>
            </div>
            
            <div className="flex border-b border-white/5 pb-2 col-span-2">
              <label className="w-1/6 text-sm font-semibold text-gray-500">Tags</label>
              <div className="w-5/6 flex gap-2">
                <span className="px-2 py-0.5 bg-violet-500/20 text-violet-300 text-xs rounded">Produit A</span>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-xs rounded">VIP</span>
              </div>
            </div>

            <div className="col-span-2 pt-4">
              <label className="block text-sm font-semibold text-gray-500 mb-2">Notes internes de l'opportunité</label>
              <div className="w-full h-32 bg-black/30 border border-white/5 rounded-lg p-3 text-sm text-gray-300">
                Le client a un budget validé pour Q3. Il attend une proposition détaillée sur la sécurité des serveurs.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Pane : Chatter (Activity Stream) */}
      <div className="w-[450px] bg-[#111118] border border-white/10 rounded-2xl flex flex-col overflow-hidden">
        <Chatter opportunityId={opportunity.id} />
      </div>

    </div>
  );
}
