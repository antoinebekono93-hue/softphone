import { Handle, Position } from '@xyflow/react';
import { Timer } from 'lucide-react';

export default function DelayNode({ data, selected }: any) {
  return (
    <div className={`px-4 py-3 shadow-lg rounded-xl bg-[var(--bg-surface-solid)] border-2 min-w-[200px] ${selected ? 'border-amber-500 shadow-amber-500/20' : 'border-[var(--border-subtle)]'} transition-all`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-amber-500 border-2 border-[var(--bg-base)]" />
      
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500">
          <Timer className="w-4 h-4" />
        </div>
        <div>
          <div className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Attente</div>
          <div className="font-bold text-[var(--text-primary)] text-sm">
            {data.duration ? `${data.duration} ${data.unit || 'minutes'}` : 'À configurer'}
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-amber-500 border-2 border-[var(--bg-base)]" />
    </div>
  );
}
