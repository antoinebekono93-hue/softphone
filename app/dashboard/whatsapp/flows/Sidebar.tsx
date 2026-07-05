import { Zap, MessageSquare, Timer, GitBranch } from "lucide-react";

export default function Sidebar() {
  const onDragStart = (event: any, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="w-64 bg-[var(--bg-base)] border-r border-[var(--border-subtle)] flex flex-col h-full shrink-0">
      <div className="p-4 border-b border-[var(--border-subtle)]">
        <h3 className="font-bold text-[var(--text-primary)]">Outils</h3>
        <p className="text-xs text-[var(--text-secondary)] mt-1">Glissez-déposez les blocs sur le canevas</p>
      </div>

      <div className="p-4 flex flex-col gap-3 overflow-y-auto">
        <div 
          className="p-3 border border-[var(--border-subtle)] bg-[var(--bg-surface-solid)] rounded-xl cursor-grab hover:border-emerald-500 transition-colors flex items-center gap-3" 
          onDragStart={(event) => onDragStart(event, 'trigger')} 
          draggable
        >
          <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg"><Zap className="w-4 h-4" /></div>
          <span className="text-sm font-bold text-[var(--text-primary)]">Déclencheur</span>
        </div>

        <div 
          className="p-3 border border-[var(--border-subtle)] bg-[var(--bg-surface-solid)] rounded-xl cursor-grab hover:border-blue-500 transition-colors flex items-center gap-3" 
          onDragStart={(event) => onDragStart(event, 'message')} 
          draggable
        >
          <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg"><MessageSquare className="w-4 h-4" /></div>
          <span className="text-sm font-bold text-[var(--text-primary)]">Action: Message</span>
        </div>

        <div 
          className="p-3 border border-[var(--border-subtle)] bg-[var(--bg-surface-solid)] rounded-xl cursor-grab hover:border-amber-500 transition-colors flex items-center gap-3" 
          onDragStart={(event) => onDragStart(event, 'delay')} 
          draggable
        >
          <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg"><Timer className="w-4 h-4" /></div>
          <span className="text-sm font-bold text-[var(--text-primary)]">Action: Délai</span>
        </div>

        <div 
          className="p-3 border border-[var(--border-subtle)] bg-[var(--bg-surface-solid)] rounded-xl cursor-grab hover:border-purple-500 transition-colors flex items-center gap-3" 
          onDragStart={(event) => onDragStart(event, 'condition')} 
          draggable
        >
          <div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg"><GitBranch className="w-4 h-4" /></div>
          <span className="text-sm font-bold text-[var(--text-primary)]">Condition: Si/Sinon</span>
        </div>
      </div>
    </aside>
  );
}
