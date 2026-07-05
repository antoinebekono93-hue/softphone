import { Handle, Position } from '@xyflow/react';
import { MessageSquare } from 'lucide-react';

export default function MessageNode({ data, selected }: any) {
  return (
    <div className={`px-4 py-3 shadow-lg rounded-xl bg-[var(--bg-surface-solid)] border-2 min-w-[220px] max-w-[280px] ${selected ? 'border-blue-500 shadow-blue-500/20' : 'border-[var(--border-subtle)]'} transition-all`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-blue-500 border-2 border-[var(--bg-base)]" />
      
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
          <MessageSquare className="w-4 h-4" />
        </div>
        <div>
          <div className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Action</div>
          <div className="font-bold text-[var(--text-primary)] text-sm">Envoyer Message</div>
        </div>
      </div>
      
      {data.templateName ? (
        <div className="text-xs text-[var(--text-secondary)] bg-[var(--bg-base)] p-2 rounded-lg truncate">
          Modèle: {data.templateName}
        </div>
      ) : data.text ? (
        <div className="text-xs text-[var(--text-secondary)] bg-[var(--bg-base)] p-2 rounded-lg truncate">
          "{data.text}"
        </div>
      ) : (
        <div className="text-xs text-rose-500 bg-rose-500/10 p-2 rounded-lg">
          À configurer
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-blue-500 border-2 border-[var(--bg-base)]" />
    </div>
  );
}
