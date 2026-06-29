"use client";

import { Opportunity } from "./CrmApp";

const STAGES = [
  { id: "NEW", name: "Nouveau" },
  { id: "QUALIFIED", name: "Qualifié" },
  { id: "PROPOSITION", name: "Proposition" },
  { id: "WON", name: "Gagné" },
];

interface KanbanBoardProps {
  opportunities: Opportunity[];
  onRecordClick: (id: string) => void;
  onUpdateOpportunities: (opps: Opportunity[]) => void;
}

export default function KanbanBoard({ opportunities, onRecordClick, onUpdateOpportunities }: KanbanBoardProps) {
  
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("recordId", id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Neccessary to allow drop
  };

  const handleDrop = (e: React.DragEvent, newStage: string) => {
    e.preventDefault();
    const recordId = e.dataTransfer.getData("recordId");
    
    // Update the state
    const updated = opportunities.map(opp => {
      if (opp.id === recordId) {
        return { ...opp, stage: newStage };
      }
      return opp;
    });
    
    onUpdateOpportunities(updated);
  };

  return (
    <div className="flex gap-4 h-full overflow-x-auto pb-4">
      {STAGES.map(stage => {
        const stageOpps = opportunities.filter(o => o.stage === stage.id);
        const stageTotal = stageOpps.reduce((sum, o) => sum + o.expectedRevenue, 0);

        return (
          <div 
            key={stage.id} 
            className="flex-shrink-0 w-[300px] flex flex-col bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, stage.id)}
          >
            {/* Column Header */}
            <div className="p-3 border-b border-white/5 flex items-center justify-between cursor-pointer hover:bg-white/[0.02]">
              <h3 className="font-semibold text-gray-200">{stage.name}</h3>
              <div className="text-xs font-medium bg-white/10 text-gray-300 px-2 py-1 rounded-md">
                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(stageTotal)}
              </div>
            </div>

            {/* Column Body */}
            <div className="flex-1 p-2 space-y-2 overflow-y-auto min-h-[200px]">
              {stageOpps.map(opp => (
                <div 
                  key={opp.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, opp.id)}
                  onClick={() => onRecordClick(opp.id)}
                  className="bg-[#111118] border border-white/10 rounded-lg p-3 cursor-pointer hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-semibold text-white text-sm group-hover:text-cyan-400 transition-colors">{opp.name}</div>
                  </div>
                  
                  <div className="text-xs text-gray-400 mb-3">{opp.company}</div>
                  
                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
                    <div className="text-xs font-medium text-emerald-400">
                      {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(opp.expectedRevenue)}
                    </div>
                    
                    <div className="flex gap-0.5 text-gray-600">
                      {[1, 2, 3].map(star => (
                        <svg key={star} className={`w-3.5 h-3.5 ${star <= opp.priority ? 'text-amber-400 fill-amber-400' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Quick Add Button */}
              <button className="w-full py-2 flex items-center justify-center gap-1 text-gray-500 hover:text-gray-300 text-sm font-medium border border-transparent hover:border-dashed hover:border-white/20 rounded-lg transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                Ajouter
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
