"use client";

import { useState } from "react";
import CampaignBuilder from "./CampaignBuilder";

export default function CampaignDashboard() {
  const [isBuilding, setIsBuilding] = useState(false);

  // Mock data for the dashboard
  const campaigns = [
    {
      id: "c1",
      name: "Promo Été 2026",
      status: "COMPLETED",
      sent: 1250,
      delivered: 1245,
      read: 890,
      replied: 120,
      date: "15 Juin 2026",
    },
    {
      id: "c2",
      name: "Relance Paniers Abandonnés",
      status: "DRAFT",
      sent: 0,
      delivered: 0,
      read: 0,
      replied: 0,
      date: "-",
    },
  ];

  if (isBuilding) {
    return <CampaignBuilder onCancel={() => setIsBuilding(false)} />;
  }

  return (
    <div className="h-full flex flex-col bg-[#0a0a0f] p-8 overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold mb-2 text-white tracking-tight">Campagnes Marketing</h1>
          <p className="text-gray-400">Gérez vos diffusions WhatsApp et analysez vos performances.</p>
        </div>
        <button
          onClick={() => setIsBuilding(true)}
          className="btn btn-primary px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-semibold shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Créer une campagne
        </button>
      </div>

      {/* AI Insights Card */}
      <div className="bg-gradient-to-r from-cyan-900/30 to-violet-900/30 border border-cyan-500/20 rounded-2xl p-5 mb-8 flex items-start gap-4">
        <div className="p-2 bg-cyan-500/20 rounded-lg text-cyan-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        </div>
        <div>
          <h3 className="text-white font-semibold mb-1 flex items-center gap-2">
            Insight IA
            <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-500/30">Nouveau</span>
          </h3>
          <p className="text-sm text-gray-300">
            D'après l'historique de vos clients, le <strong>Mardi à 10h00</strong> est le moment optimal pour vos campagnes promotionnelles (taux d'ouverture attendu: +22%).
          </p>
        </div>
      </div>

      {/* Campaigns List */}
      <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-black/20">
              <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Campagne</th>
              <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Statut</th>
              <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Envoyés</th>
              <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Taux d'ouverture</th>
              <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Taux de réponse</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((camp) => (
              <tr key={camp.id} className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer">
                <td className="p-4">
                  <div className="font-medium text-white">{camp.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{camp.date}</div>
                </td>
                <td className="p-4">
                  {camp.status === "COMPLETED" && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Terminée
                    </span>
                  )}
                  {camp.status === "DRAFT" && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-500/10 text-gray-400 border border-gray-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span> Brouillon
                    </span>
                  )}
                </td>
                <td className="p-4 text-gray-300">{camp.sent > 0 ? camp.sent.toLocaleString() : "-"}</td>
                <td className="p-4">
                  {camp.sent > 0 ? (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-300">{Math.round((camp.read / camp.delivered) * 100)}%</span>
                      <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500" style={{ width: `${(camp.read / camp.delivered) * 100}%` }}></div>
                      </div>
                    </div>
                  ) : "-"}
                </td>
                <td className="p-4">
                  {camp.sent > 0 ? (
                    <span className="text-emerald-400 font-medium">{Math.round((camp.replied / camp.read) * 100)}%</span>
                  ) : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
