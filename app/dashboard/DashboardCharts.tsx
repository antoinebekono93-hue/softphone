"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Activity, Phone, MessageSquare, Sparkles } from 'lucide-react';

type ChartData = {
  date: string;
  calls: number;
  messages: number;
};

type LiveActivity = {
  id: string;
  type: 'CALL' | 'SMS' | 'WHATSAPP' | 'AI_CALL';
  title: string;
  time: string;
  description?: string;
};

export function DashboardCharts({ data, activities }: { data: ChartData[], activities: LiveActivity[] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
      {/* Main Chart */}
      <div className="lg:col-span-2 glass-panel p-6 rounded-2xl flex flex-col">
        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2">
          <Activity className="w-5 h-5 text-[cyan-500]" />
          Volume de Communications (7 derniers jours)
        </h3>
        <div className="flex-1 min-h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent-cyan)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--accent-cyan)" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent-violet)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--accent-violet)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(10,10,15,0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Area type="monotone" dataKey="calls" name="Appels" stroke="var(--accent-cyan)" strokeWidth={3} fillOpacity={1} fill="url(#colorCalls)" />
              <Area type="monotone" dataKey="messages" name="Messages" stroke="var(--accent-violet)" strokeWidth={3} fillOpacity={1} fill="url(#colorMessages)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Live Feed */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col">
        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-6">Flux d'Activité en Direct</h3>
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
          {activities.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)] text-center mt-10">Aucune activité récente.</p>
          ) : (
            activities.map(activity => (
              <div key={activity.id} className="flex gap-4">
                <div className="mt-1">
                  {activity.type === 'CALL' && <div className="w-8 h-8 rounded-full bg-[emerald-500]/10 text-[emerald-500] flex items-center justify-center"><Phone className="w-4 h-4" /></div>}
                  {activity.type === 'AI_CALL' && <div className="w-8 h-8 rounded-full bg-[cyan-500]/10 text-[cyan-500] flex items-center justify-center"><Sparkles className="w-4 h-4" /></div>}
                  {activity.type === 'SMS' && <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center"><MessageSquare className="w-4 h-4" /></div>}
                  {activity.type === 'WHATSAPP' && <div className="w-8 h-8 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center"><MessageSquare className="w-4 h-4" /></div>}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[var(--text-primary)]">{activity.title}</p>
                  {activity.description && <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">{activity.description}</p>}
                  <p className="text-[10px] text-[var(--text-secondary)] mt-1">{activity.time}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
