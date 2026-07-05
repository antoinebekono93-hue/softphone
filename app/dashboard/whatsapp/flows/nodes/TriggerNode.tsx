import { Handle, Position } from '@xyflow/react';
import { Zap } from 'lucide-react';

export default function TriggerNode({ data, selected }: any) {
  return (
    <div className={`px-4 py-3 shadow-lg rounded-xl bg-[var(--bg-surface-solid)] border-2 min-w-[200px] ${selected ? 'border-emerald-500 shadow-emerald-500/20' : 'border-[var(--border-subtle)]'} transition-all`}>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
          <Zap className="w-4 h-4" />
        </div>
        <div>
          <div className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Déclencheur</div>
          <div className="font-bold text-[var(--text-primary)] text-sm">{data.label || 'Nouveau Contact'}</div>
        </div>
      </div>
      
      {/* Trigger nodes only have an output handle (source) */}
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-emerald-500 border-2 border-[var(--bg-base)]" />
    </div>
  );
}
