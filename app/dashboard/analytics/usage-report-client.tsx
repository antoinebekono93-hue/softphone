"use client";

import { useEffect, useState } from "react";
import { Loader2, DollarSign, Activity } from "lucide-react";

export default function UsageReportClient() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsage() {
      try {
        const res = await fetch("/api/analytics/usage");
        if (res.ok) {
          const json = await res.json();
          setData(json.data || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchUsage();
  }, []);

  return (
    <div className="glass-panel p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            Rapport de Consommation
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Données d'utilisation (Telnyx API v2)
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--text-secondary)]" />
          </div>
        ) : data.length === 0 ? (
          <div className="text-sm text-[var(--text-secondary)]">Aucune donnée trouvée.</div>
        ) : (
          <div className="space-y-4">
            {data.map((item, i) => (
              <div key={i} className="flex justify-between items-center p-4 bg-[var(--bg-surface-solid)]/30 rounded-xl border border-[var(--border-subtle)]">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Activity className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-[var(--text-primary)] capitalize">{item.product.replace('-', ' ')}</div>
                    <div className="text-xs text-[var(--text-secondary)]">
                      {item.connected ? `${item.connected} connectés` : item.count ? `${item.count} unités` : 'Usage'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-emerald-400 text-lg">${item.cost.toFixed(4)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
