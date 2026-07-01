"use client";

import { useState, useEffect } from "react";
import { Plus, X, Loader2, QrCode, CheckSquare, Settings2, ShieldAlert, Wifi } from "lucide-react";

type SimCard = {
  id: string;
  iccid: string;
  type: string;
  status: string;
  name: string;
  dataUsedMB: number;
  dataLimitMB: number | null;
  alertEnabled: boolean;
  lpaCode: string | null;
  publicIpEnabled?: boolean;
  voiceEnabled?: boolean;
  voicePhoneNumber?: string | null;
};

export default function IotDashboardPage() {
  const [activeTab, setActiveTab] = useState("fleet");
  const [sims, setSims] = useState<SimCard[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const [selectedLpa, setSelectedLpa] = useState<string | null>(null);

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Limit Modal
  const [limitModalSim, setLimitModalSim] = useState<SimCard | null>(null);
  const [limitValue, setLimitValue] = useState("");
  const [alertEnabled, setAlertEnabled] = useState(false);
  const [savingLimit, setSavingLimit] = useState(false);

  const fetchSims = async () => {
    try {
      const res = await fetch('/api/iot/sims');
      if (res.ok) {
        setSims(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSims();
  }, []);

  const handleOrder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setOrdering(true);
    const formData = new FormData(e.currentTarget);
    const type = formData.get('type') as string;
    const name = formData.get('name') as string;

    try {
      const res = await fetch('/api/iot/sims', {
        method: 'POST',
        body: JSON.stringify({ type, name, price: type === 'ESIM' ? 2.50 : 5.00 }),
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchSims();
        window.location.reload();
      }
    } finally {
      setOrdering(false);
    }
  };

  const handleBulkToggle = async (targetStatus: string) => {
    try {
      const res = await fetch('/api/iot/sims/bulk-toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds, targetStatus })
      });
      if (res.ok) {
        setSelectedIds([]);
        fetchSims();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedIds(sims.map(s => s.id));
    else setSelectedIds([]);
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(i => i !== id));
    else setSelectedIds([...selectedIds, id]);
  };

  const openLimitModal = (sim: SimCard) => {
    setLimitModalSim(sim);
    setLimitValue(sim.dataLimitMB ? sim.dataLimitMB.toString() : "");
    setAlertEnabled(sim.alertEnabled || false);
  };

  const saveLimit = async () => {
    if (!limitModalSim) return;
    setSavingLimit(true);
    try {
      const res = await fetch(`/api/iot/sims/${limitModalSim.id}/limit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataLimitMB: limitValue, alertEnabled })
      });
      if (res.ok) {
        setLimitModalSim(null);
        fetchSims();
      }
    } finally {
      setSavingLimit(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto relative">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 text-[var(--text-primary)]">
            Connectivité <span className="text-gradient">IoT & eSIM</span>
          </h1>
          <p className="text-[var(--text-secondary)] text-sm md:text-base">
            Gérez votre flotte eSIM globale, fixez des limites de coûts et gérez vos cartes en masse.
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full md:w-auto btn-primary-gradient"
        >
          <Plus className="w-5 h-5" /> Commander SIM
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
        <div className="glass-panel p-6 flex items-start justify-between">
          <div>
            <div className="text-[var(--text-secondary)] text-xs font-bold uppercase tracking-wider mb-2">SIM Actives</div>
            <div className="text-3xl md:text-4xl font-bold text-[var(--text-primary)]">{sims.filter(s => s.status === 'enabled').length}</div>
          </div>
          <div className="p-3 bg-[var(--bg-surface-hover)] rounded-xl border border-[var(--border-subtle)] text-[var(--text-secondary)] shadow-sm">
            <Wifi className="w-6 h-6" />
          </div>
        </div>
        
        <div className="glass-panel p-6 flex items-start justify-between relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-cyan-500/20 blur-2xl rounded-full"></div>
          <div className="relative z-10">
            <div className="text-[var(--text-secondary)] text-xs font-bold uppercase tracking-wider mb-2">Volume Data (Ce mois)</div>
            <div className="text-3xl md:text-4xl font-bold text-cyan-500">
              {sims.reduce((acc, sim) => acc + sim.dataUsedMB, 0).toFixed(1)} <span className="text-lg font-medium">MB</span>
            </div>
          </div>
        </div>
        
        <div className="glass-panel p-6 flex items-start justify-between">
          <div>
            <div className="text-[var(--text-secondary)] text-xs font-bold uppercase tracking-wider mb-2">Cartes sous Alertes</div>
            <div className="text-3xl md:text-4xl font-bold text-amber-500 flex items-center gap-2">
               {sims.filter(s => s.alertEnabled).length}
            </div>
          </div>
          <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-500 shadow-sm">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="flex border-b border-[var(--border-subtle)] mb-6">
        <button
          onClick={() => setActiveTab("fleet")}
          className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "fleet" ? "border-cyan-500 text-cyan-500" : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          Flotte Connectée
        </button>
        <button
          onClick={() => setActiveTab("network")}
          className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "network" ? "border-cyan-500 text-cyan-500" : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          Réseau & Sécurité
        </button>
      </div>

      {activeTab === "fleet" && (
        <div className="glass-panel flex flex-col overflow-hidden shadow-sm">
          {selectedIds.length > 0 ? (
          <div className="bg-cyan-500/10 border-b border-cyan-500/20 p-4 flex items-center justify-between">
            <div className="text-cyan-500 font-semibold text-sm flex items-center gap-2">
              <CheckSquare className="w-4 h-4" /> {selectedIds.length} carte(s) sélectionnée(s)
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => handleBulkToggle('SUSPENDED')} className="px-4 py-1.5 bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-md text-sm font-medium hover:bg-[var(--bg-surface-hover)] transition-colors">Suspendre</button>
              <button onClick={() => handleBulkToggle('ACTIVE')} className="px-4 py-1.5 bg-cyan-500 text-white rounded-md text-sm font-medium hover:bg-cyan-600 shadow-sm shadow-cyan-500/20 transition-colors">Activer</button>
            </div>
          </div>
        ) : (
          <div className="flex border-b border-[var(--border-subtle)] bg-[var(--bg-surface-solid)]/30">
            <div className="px-6 py-4 text-sm font-semibold text-cyan-500 border-b-2 border-cyan-500">Flotte Connectée</div>
          </div>
        )}

        <div className="p-0 overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[var(--bg-surface-solid)]/30 border-b border-[var(--border-subtle)] text-[var(--text-secondary)]">
              <tr>
                <th className="px-6 py-4 font-medium w-10">
                  <input type="checkbox" className="rounded border-[var(--border-subtle)] text-cyan-500 focus:ring-cyan-500 bg-[var(--bg-surface-solid)]" onChange={handleSelectAll} checked={sims.length > 0 && selectedIds.length === sims.length} />
                </th>
                <th className="px-6 py-4 font-medium">Appareil / ICCID</th>
                <th className="px-6 py-4 font-medium">Statut</th>
                <th className="px-6 py-4 font-medium">Consommation & Limite</th>
                <th className="px-6 py-4 font-medium">VoLTE (Téléphonie)</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-[var(--text-secondary)]"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" /></td></tr>
              ) : sims.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-[var(--text-secondary)]">Aucune carte SIM trouvée.</td></tr>
              ) : sims.map((item) => {
                const percent = item.dataLimitMB ? Math.min((item.dataUsedMB / item.dataLimitMB) * 100, 100) : 0;
                const isWarning = percent > 80;
                
                return (
                  <tr key={item.id} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                    <td className="px-6 py-4">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(item.id)} 
                        onChange={() => handleSelectOne(item.id)}
                        className="rounded border-[var(--border-subtle)] text-cyan-500 focus:ring-cyan-500 bg-[var(--bg-surface-solid)]" 
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-[var(--text-primary)] flex items-center gap-2">
                        {item.name}
                        <span className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded ${item.type === 'ESIM' ? 'bg-violet-500/10 text-violet-500 border border-violet-500/20' : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'}`}>{item.type}</span>
                      </div>
                      <div className="text-[var(--text-secondary)] text-xs mt-1 font-mono">{item.iccid}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-md flex items-center w-fit gap-1.5 ${item.status === 'enabled' ? 'badge-glass-green' : 'badge-glass-gray'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${item.status === 'enabled' ? 'bg-emerald-500' : 'bg-gray-400'}`}></div>
                        {item.status === 'enabled' ? 'Connecté' : item.status === 'registered' ? 'Enregistré' : 'Suspendu'}
                      </span>
                    </td>
                    <td className="px-6 py-4 min-w-[200px]">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-mono text-[var(--text-primary)]">{item.dataUsedMB.toFixed(1)} MB</span>
                        {item.dataLimitMB ? (
                          <span className="font-mono text-[var(--text-secondary)]">/ {item.dataLimitMB} MB</span>
                        ) : (
                          <span className="text-[var(--text-secondary)] italic">No limit</span>
                        )}
                      </div>
                      {item.dataLimitMB && (
                        <div className="w-full bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded-full h-1.5 mb-1 overflow-hidden flex">
                          <div className={`h-full ${isWarning ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' : 'bg-gradient-to-r from-cyan-400 to-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.5)]'}`} style={{ width: `${percent}%` }}></div>
                        </div>
                      )}
                      {item.alertEnabled && <div className="text-[10px] text-amber-500 font-semibold flex items-center gap-1 mt-1"><ShieldAlert className="w-3 h-3"/> Alertes activées</div>}
                    </td>
                    <td className="px-6 py-4">
                      {item.voiceEnabled ? (
                        <div>
                          <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Voix Active</span>
                          <div className="text-[var(--text-secondary)] text-xs mt-1 font-mono">{item.voicePhoneNumber}</div>
                        </div>
                      ) : (
                        <span className="text-[var(--text-secondary)] text-xs italic">Désactivée</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-3 items-center">
                      <button onClick={() => openLimitModal(item)} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-md hover:bg-[var(--bg-surface-hover)] transition-colors" title="Configurer Limites"><Settings2 className="w-4 h-4" /></button>
                      
                      {!item.voiceEnabled ? (
                         <button 
                         onClick={async () => {
                           if (confirm("Activer la ligne vocale sur cette SIM ? (Coût : 1$/mois)")) {
                             await fetch(`/api/iot/sims/${item.id}/voice`, { method: "POST" });
                             fetchSims();
                           }
                         }}
                         className="px-3 py-1.5 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 rounded-md font-medium text-xs transition-colors"
                       >
                         Activer Voix (1$)
                       </button>
                      ) : (
                        <button 
                        onClick={async () => {
                          if (confirm("Désactiver la ligne vocale ?")) {
                            await fetch(`/api/iot/sims/${item.id}/voice`, { method: "DELETE" });
                            fetchSims();
                          }
                        }}
                        className="px-3 py-1.5 bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-md font-medium text-xs transition-colors"
                      >
                        Désactiver Voix
                      </button>
                      )}

                      {item.type === 'ESIM' && item.lpaCode && (
                        <button onClick={() => setSelectedLpa(item.lpaCode)} className="text-violet-500 hover:text-violet-400 font-medium text-sm flex items-center gap-1 bg-violet-500/10 px-3 py-1.5 rounded-md transition-colors">
                          <QrCode className="w-4 h-4" /> QR
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {activeTab === "network" && (
        <div className="space-y-6">
          <div className="glass-panel p-6">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Adresses IP Publiques</h2>
            <p className="text-sm text-[var(--text-secondary)] mb-6">
              Attribuez une IP publique statique à vos cartes SIM pour y accéder depuis l'extérieur (SSH, Serveurs Web).
              <br />
              <span className="text-rose-400 font-medium mt-1 inline-block">Coût : 3,00 $ / mois par carte SIM. Déduit de votre Wallet.</span>
            </p>
            
            <div className="overflow-x-auto border border-[var(--border-subtle)] rounded-xl">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-[var(--bg-surface-solid)]/30 border-b border-[var(--border-subtle)] text-[var(--text-secondary)]">
                  <tr>
                    <th className="px-6 py-4 font-medium">Carte SIM</th>
                    <th className="px-6 py-4 font-medium">Statut IP Publique</th>
                    <th className="px-6 py-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {sims.map((item) => (
                    <tr key={item.id} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-[var(--text-primary)]">{item.name}</div>
                        <div className="text-[var(--text-secondary)] text-xs mt-1 font-mono">{item.iccid}</div>
                      </td>
                      <td className="px-6 py-4">
                        {item.publicIpEnabled ? (
                          <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Active</span>
                        ) : (
                          <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-gray-500/10 text-gray-400 border border-gray-500/20">Désactivée</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {!item.publicIpEnabled ? (
                          <button 
                            onClick={async () => {
                              if (confirm("Attribuer une IP publique ? Cela coûtera 3$/mois.")) {
                                await fetch(`/api/iot/sims/${item.id}/public-ip`, { method: "POST" });
                                fetchSims();
                              }
                            }}
                            className="px-3 py-1.5 bg-cyan-500/10 text-cyan-500 hover:bg-cyan-500/20 rounded-md font-medium text-xs transition-colors"
                          >
                            Activer IP Publique (3$/mo)
                          </button>
                        ) : (
                          <button 
                            onClick={async () => {
                              await fetch(`/api/iot/sims/${item.id}/public-ip`, { method: "DELETE" });
                              fetchSims();
                            }}
                            className="px-3 py-1.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 rounded-md font-medium text-xs transition-colors"
                          >
                            Retirer IP Publique
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-panel p-6">
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Politiques de Trafic</h2>
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                Créez des listes blanches/noires pour restreindre les domaines ou les IP auxquels vos appareils peuvent accéder.
              </p>
              
              <button 
                onClick={async () => {
                  const domain = prompt("Entrez le domaine à mettre en liste blanche (ex: api.entreprise.com):");
                  if (domain) {
                    await fetch('/api/iot/policies', { method: 'POST', body: JSON.stringify({ domain }) });
                    alert("Politique créée chez Telnyx !");
                  }
                }}
                className="w-full py-2.5 bg-[var(--bg-surface-solid)] border border-cyan-500/30 text-cyan-500 rounded-lg text-sm font-semibold hover:bg-cyan-500/10 transition-colors"
              >
                + Nouvelle Politique de Liste Blanche
              </button>
            </div>

            <div className="glass-panel p-6 border-violet-500/30">
              <h2 className="text-xl font-bold text-violet-400 mb-2">Passerelles Privées (PWG)</h2>
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                Acheminez tout le trafic de vos SIMs vers votre réseau d'entreprise via un VPN Cloud (VRF/MPLS).
              </p>
              
              <button 
                onClick={async () => {
                  await fetch('/api/iot/pwg-ticket', { method: 'POST' });
                  alert("Une demande a été envoyée au support Telnyx. Ils vous contacteront pour configurer le VPN Cloud et le routage.");
                }}
                className="w-full py-2.5 bg-violet-500/10 border border-violet-500/30 text-violet-400 rounded-lg text-sm font-semibold hover:bg-violet-500/20 transition-colors"
              >
                Demander une configuration PWG
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Limit Modal */}
      {limitModalSim && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="glass-panel bg-[var(--bg-surface-solid)] rounded-2xl p-6 w-full max-w-sm shadow-2xl relative border border-[var(--border-subtle)] animate-in zoom-in-95">
            <button onClick={() => setLimitModalSim(null)} className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"><X className="w-5 h-5" /></button>
            <h2 className="text-xl font-bold mb-1 text-[var(--text-primary)] flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-amber-500" /> Contrôle des Coûts</h2>
            <p className="text-sm text-[var(--text-secondary)] mb-6">Sécurisez la consommation de la SIM <strong>{limitModalSim.name}</strong>.</p>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1">Plafond de données (MB)</label>
                <input 
                  type="number" value={limitValue} onChange={e => setLimitValue(e.target.value)} placeholder="ex: 500"
                  className="w-full px-3 py-2 bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded-lg text-sm focus:outline-none focus:border-cyan-500 text-[var(--text-primary)] transition-colors" 
                />
                <p className="text-xs text-[var(--text-secondary)] mt-1">Laissez vide pour une data illimitée.</p>
              </div>

              <label className="flex items-center gap-3 cursor-pointer p-3 border border-[var(--border-subtle)] rounded-lg hover:bg-[var(--bg-surface-hover)] transition-colors">
                <input type="checkbox" checked={alertEnabled} onChange={e => setAlertEnabled(e.target.checked)} className="w-4 h-4 rounded border-[var(--border-subtle)] text-cyan-500 focus:ring-cyan-500 bg-[var(--bg-surface-solid)]" />
                <div className="text-sm">
                  <div className="font-semibold text-[var(--text-primary)]">Activer les alertes SMS/Email</div>
                  <div className="text-[var(--text-secondary)] text-xs">Prévenir à 80% et 100% du quota</div>
                </div>
              </label>

              <button onClick={saveLimit} disabled={savingLimit} className="w-full py-2.5 btn-primary-gradient rounded-lg font-semibold flex justify-center items-center">
                {savingLimit ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="glass-panel bg-[var(--bg-surface-solid)] rounded-2xl p-6 w-full max-w-md shadow-2xl relative border border-[var(--border-subtle)] animate-in zoom-in-95">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold mb-1 text-[var(--text-primary)]">Commander une SIM</h2>
            <p className="text-sm text-[var(--text-secondary)] mb-6">Le montant sera déduit de votre Wallet.</p>

            <form onSubmit={handleOrder} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Nom / Appareil</label>
                <input required name="name" type="text" placeholder="Ex: iPad Directeur" className="w-full px-3 py-2 bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-cyan-500 transition-colors" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Type de SIM</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="border border-[var(--border-subtle)] bg-[var(--bg-surface-solid)] rounded-lg p-3 cursor-pointer hover:bg-[var(--bg-surface-hover)] flex flex-col gap-1 items-center justify-center text-center transition-colors">
                    <input type="radio" name="type" value="ESIM" defaultChecked className="sr-only peer" />
                    <div className="peer-checked:text-cyan-500 font-bold text-[var(--text-primary)]">eSIM</div>
                    <div className="text-xs text-[var(--text-secondary)]">Immédiat - $2.50</div>
                    <div className="w-4 h-4 rounded-full border border-[var(--border-subtle)] mt-2 peer-checked:bg-cyan-500 peer-checked:border-cyan-500 transition-colors"></div>
                  </label>
                  <label className="border border-[var(--border-subtle)] bg-[var(--bg-surface-solid)] rounded-lg p-3 cursor-pointer flex flex-col gap-1 items-center justify-center text-center opacity-50">
                    <input disabled type="radio" name="type" value="PHYSICAL" className="sr-only peer" />
                    <div className="font-bold text-[var(--text-primary)]">SIM Physique</div>
                    <div className="text-xs text-[var(--text-secondary)]">Indisponible</div>
                    <div className="w-4 h-4 rounded-full border border-[var(--border-subtle)] mt-2"></div>
                  </label>
                </div>
              </div>

              <button disabled={ordering} type="submit" className="w-full mt-4 py-2.5 btn-primary-gradient rounded-lg font-semibold flex justify-center items-center">
                {ordering ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirmer et Payer'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {selectedLpa && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="glass-panel bg-[var(--bg-surface-solid)] rounded-2xl p-8 w-full max-w-sm shadow-2xl relative flex flex-col items-center text-center border border-[var(--border-subtle)] animate-in zoom-in-95">
            <button onClick={() => setSelectedLpa(null)} className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"><X className="w-5 h-5" /></button>
            <h2 className="text-xl font-bold mb-2 text-[var(--text-primary)]">Scanner pour activer</h2>
            <div className="w-48 h-48 bg-white rounded-lg border-2 border-dashed border-[var(--border-subtle)] flex items-center justify-center mb-6">
               <QrCode className="w-40 h-40 text-black" />
            </div>
            <div className="text-xs text-[var(--text-primary)] font-mono bg-[var(--bg-surface-hover)] p-3 rounded-lg w-full break-all border border-[var(--border-subtle)]">
              {selectedLpa}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
