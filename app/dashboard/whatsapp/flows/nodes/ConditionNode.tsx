import { Handle, Position } from '@xyflow/react';
import { GitBranch } from 'lucide-react';

export default function ConditionNode({ data, selected }: any) {
  return (
    <div className={`px-4 py-3 shadow-lg rounded-xl bg-[var(--bg-surface-solid)] border-2 min-w-[220px] ${selected ? 'border-purple-500 shadow-purple-500/20' : 'border-[var(--border-subtle)]'} transition-all`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-purple-500 border-2 border-[var(--bg-base)]" />
      
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-500">
          <GitBranch className="w-4 h-4" />
        </div>
        <div>
          <div className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Condition</div>
          <div className="font-bold text-[var(--text-primary)] text-sm">
            {data.conditionType ? 'Si: ' + data.conditionType : 'À configurer'}
          </div>
        </div>
      </div>
      
      <div className="flex justify-between mt-2 pt-2 border-t border-[var(--border-subtle)]">
        <div className="text-[10px] font-bold text-emerald-500">VRAI</div>
        <div className="text-[10px] font-bold text-rose-500">FAUX</div>
      </div>

      {/* True Handle */}
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="true" 
        style={{ left: '25%' }}
        className="w-3 h-3 bg-emerald-500 border-2 border-[var(--bg-base)]" 
      />
      {/* False Handle */}
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="false" 
        style={{ left: '75%' }}
        className="w-3 h-3 bg-rose-500 border-2 border-[var(--bg-base)]" 
      />
    </div>
  );
}
