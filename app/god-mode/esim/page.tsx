"use client";

import { useState, useEffect } from "react";
import { Wifi, Activity, QrCode, Download, Database, AlertTriangle, ShieldCheck, Search, Plus, RefreshCw, Smartphone } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getSimCards, purchaseEsim, updateSimCard, setSimCardStatus, createDataUsageNotification, getEsimActivationCode, EsimStatus } from "@/lib/telnyx-esim";
import { EsimQrDialog } from "@/components/esim-qr-dialog";

export default function GodModeEsimPage() {
  const [dataLimit, setDataLimit] = useState(10);
  const [simCards, setSimCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedSimForQr, setSelectedSimForQr] = useState<string | null>(null);

  useEffect(() => {
    fetchSimCards();
  }, []);

  const fetchSimCards = async () => {
    setLoading(true);
    const res = await getSimCards();
    if (res.success && res.data) {
      setSimCards(res.data);
    }
    setLoading(false);
  };

  const handlePurchaseEsim = async () => {
    if (!confirm("Voulez-vous vraiment commander une nouvelle eSIM ? Cela sera facturé sur votre compte Telnyx.")) return;
    setPurchasing(true);
    const res = await purchaseEsim(1);
    if (res.success) {
      alert("eSIM commandée avec succès !");
      fetchSimCards();
    } else {
      alert("Erreur lors de l'achat: " + res.error);
    }
    setPurchasing(false);
  };

  const handleStatusChange = async (simId: string, status: EsimStatus) => {
    const res = await setSimCardStatus(simId, status);
    if (res.success) {
      fetchSimCards();
    } else {
      alert("Erreur lors du changement de statut: " + res.error);
    }
  };

  const applyDataLimitToAll = async () => {
    if (!confirm(`Voulez-vous appliquer une limite de ${dataLimit} GB et créer des alertes pour toutes vos eSIMs ?`)) return;
    
    for (const sim of simCards) {
      await updateSimCard(sim.id, {
        data_limit: { amount: dataLimit.toString(), unit: "GB" }
      });
      // Optionally create a notification alert (80% of data limit, etc)
      await createDataUsageNotification(sim.id, (dataLimit * 0.8).toString(), "GB");
    }
    alert("Limites de données appliquées.");
    fetchSimCards();
  };

  return (
    <div className="w-full">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-[var(--text-primary)] flex items-center gap-3">
             <Wifi className="text-cyan-500" />
             Gestion des eSIM (Wireless & IoT)
          </h1>
          <p className="text-[var(--text-secondary)]">Déploiement et contrôle de la connectivité globale pour flottes IoT et mobiles.</p>
        </div>
        <Button onClick={handlePurchaseEsim} disabled={purchasing} className="bg-cyan-600 hover:bg-cyan-700 text-white">
           {purchasing ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />} 
           Nouvelle flotte eSIM
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
         <Card className="p-8 rounded-2xl flex flex-col hover:border-[var(--border-glow)] hover:bg-[var(--bg-surface-hover)] hover:shadow-[var(--shadow-hover)]">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-[var(--text-primary)]">
               <QrCode className="text-violet-500" />
               Déploiement de Profils (OTA)
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mb-6">
               Générez et activez des profils eSIM virtuels instantanément.
            </p>

            <div className="space-y-4 flex-1">
               <div className="p-5 border border-[var(--border-subtle)] bg-[var(--bg-surface-hover)] rounded-xl relative overflow-hidden">
                  <div className="flex justify-between items-center mb-2">
                     <div className="flex items-center gap-2">
                        <Download className="w-4 h-4 text-cyan-500" />
                        <h3 className="font-bold text-[var(--text-primary)]">Téléchargement passif</h3>
                     </div>
                     <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-500 text-[10px] font-bold uppercase rounded">Recommandé pour IoT</span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">
                     Le profil est téléchargé sur le composant (eUICC) mais ne consomme pas de forfait tant qu'il n'est pas réveillé par API.
                  </p>
               </div>

               <div className="p-5 border border-[var(--border-subtle)] bg-[var(--bg-surface-hover)] rounded-xl relative overflow-hidden">
                  <div className="flex justify-between items-center mb-2">
                     <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-emerald-500" />
                        <h3 className="font-bold text-[var(--text-primary)]">Activation par sélection</h3>
                     </div>
                     <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase rounded">Smartphones</span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mb-3">
                     Sélectionnez une eSIM depuis la liste d'inventaire ci-dessous pour afficher son QR Code d'activation.
                  </p>
               </div>
            </div>
         </Card>

         <Card className="p-8 rounded-2xl flex flex-col hover:border-[var(--border-glow)] hover:bg-[var(--bg-surface-hover)] hover:shadow-[var(--shadow-hover)]">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-[var(--text-primary)]">
               <Database className="text-emerald-500" />
               Forfaits & Limites de Consommation
            </h2>

            <div className="space-y-6 flex-1">
               <div className="p-5 border border-rose-500/20 bg-rose-500/5 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                     <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-500" />
                        <h3 className="font-bold text-[var(--text-primary)] text-sm">Alerte & Blocage (Data Limit)</h3>
                     </div>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mb-4">
                     Définit la limite maximale par eSIM. Au-delà, l'eSIM est suspendue temporairement. Des webhooks seront déclenchés à 80% du seuil.
                  </p>
                  <div className="flex items-center gap-4 mb-4">
                     <input 
                        type="range" 
                        min="1" max="100" step="1"
                        value={dataLimit}
                        onChange={(e) => setDataLimit(parseInt(e.target.value))}
                        className="flex-1 accent-rose-500"
                     />
                     <div className="font-mono font-bold text-lg text-rose-500 w-20 text-right">
                        {dataLimit} GB
                     </div>
                  </div>
                  <Button onClick={applyDataLimitToAll} className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs py-2 h-auto">
                     Appliquer à toutes les eSIMs
                  </Button>
               </div>
               
               <div>
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">Instructions Webhook</label>
                  <div className="p-4 bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-secondary)] text-xs leading-relaxed">
                     Configurez l'URL de réception dans le portail <strong>Mission Control</strong> de Telnyx (Wireless &gt; Network Preferences) pour intercepter les événements d'alerte de data (`sim.data_usage.threshold_reached`).
                  </div>
               </div>
            </div>
         </Card>
      </div>

      <Card className="p-8 rounded-2xl hover:border-[var(--border-glow)] hover:bg-[var(--bg-surface-hover)] hover:shadow-[var(--shadow-hover)]">
         <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <div>
               <h2 className="text-xl font-bold flex items-center gap-2 text-[var(--text-primary)]">
                  <Activity className="text-cyan-500" />
                  Flotte Active (Inventaire eSIM)
               </h2>
               <p className="text-sm text-[var(--text-secondary)] mt-1">Vue globale des cartes SIM physiques et eSIM virtuelles déployées via l'API Telnyx.</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
               <Button onClick={fetchSimCards} variant="icon" className="shrink-0 border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] w-9 h-9 p-0">
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
               </Button>
               <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                  <input 
                     type="text"
                     placeholder="Rechercher par ICCID..."
                     className="w-full pl-9 pr-4 py-2 bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-lg text-sm text-[var(--text-primary)] focus:border-cyan-500 outline-none"
                  />
               </div>
            </div>
         </div>
         
         <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
               <thead>
                  <tr className="border-b border-[var(--border-subtle)] text-[var(--text-secondary)]">
                     <th className="pb-3 font-semibold">ICCID / EID</th>
                     <th className="pb-3 font-semibold">Type</th>
                     <th className="pb-3 font-semibold">Consommation (Mois)</th>
                     <th className="pb-3 font-semibold">Statut</th>
                     <th className="pb-3 font-semibold text-right">Actions</th>
                  </tr>
               </thead>
               <tbody>
                  {loading && simCards.length === 0 ? (
                     <tr>
                        <td colSpan={5} className="py-8 text-center text-[var(--text-secondary)]">Chargement de l'inventaire...</td>
                     </tr>
                  ) : simCards.length === 0 ? (
                     <tr>
                        <td colSpan={5} className="py-8 text-center text-[var(--text-secondary)]">Aucune eSIM trouvée dans votre flotte Telnyx.</td>
                     </tr>
                  ) : (
                     simCards.map((sim: any) => (
                        <tr key={sim.id} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)] transition-colors">
                           <td className="py-4">
                              <div className="font-mono text-xs text-[var(--text-primary)]">{sim.iccid}</div>
                              {sim.eid && <div className="font-mono text-[10px] text-[var(--text-secondary)] mt-1">EID: {sim.eid}</div>}
                           </td>
                           <td className="py-4 text-[var(--text-secondary)]">
                              {sim.type === 'esim' ? (
                                 <span className="flex items-center gap-1"><Smartphone className="w-3 h-3" /> eSIM</span>
                              ) : (
                                 <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> Physique</span>
                              )}
                           </td>
                           <td className="py-4 font-mono text-cyan-500 font-medium">
                              {sim.current_billing_period_consumed_data?.amount || "0"} {sim.current_billing_period_consumed_data?.unit || "MB"}
                              <span className="text-[var(--text-secondary)] text-xs"> / {sim.data_limit?.amount || "∞"} {sim.data_limit?.unit}</span>
                           </td>
                           <td className="py-4">
                              {sim.status === 'enabled' && <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase rounded-md">Actif</span>}
                              {sim.status === 'disabled' && <span className="px-2 py-1 bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] text-[var(--text-secondary)] text-[10px] font-bold uppercase rounded-md">Inactif</span>}
                              {sim.status === 'standby' && <span className="px-2 py-1 bg-amber-500/10 text-amber-500 text-[10px] font-bold uppercase rounded-md">Standby</span>}
                              {sim.status === 'data_limit_exceeded' && <span className="px-2 py-1 bg-rose-500/10 text-rose-500 text-[10px] font-bold uppercase rounded-md">Quota Atteint</span>}
                           </td>
                           <td className="py-4 text-right space-x-2">
                              {sim.type === 'esim' && (
                                 <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setSelectedSimForQr(sim.id)}
                                    className="border-violet-500/30 text-violet-500 hover:bg-violet-500/10 h-8 text-xs"
                                 >
                                    QR Code
                                 </Button>
                              )}
                              {sim.status === 'enabled' ? (
                                 <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => handleStatusChange(sim.id, 'standby')}
                                    className="border-amber-500/30 text-amber-500 hover:bg-amber-500/10 h-8 text-xs"
                                 >
                                    Suspendre
                                 </Button>
                              ) : (
                                 <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => handleStatusChange(sim.id, 'enabled')}
                                    className="border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 h-8 text-xs"
                                 >
                                    Activer
                                 </Button>
                              )}
                           </td>
                        </tr>
                     ))
                  )}
               </tbody>
            </table>
         </div>
      </Card>

      <EsimQrDialog 
         open={!!selectedSimForQr} 
         onClose={() => setSelectedSimForQr(null)} 
         simId={selectedSimForQr} 
         fetchActivationCode={getEsimActivationCode}
      />
    </div>
  );
}