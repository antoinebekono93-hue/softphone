"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Smartphone, QrCode, CreditCard, Activity, RefreshCw } from "lucide-react";
import { purchaseEsimForUser, getMyActivationCode, activateMySimCard, renameMySimCard } from "./actions";
import { EsimQrDialog } from "@/components/esim-qr-dialog";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Check, Edit2, X } from "lucide-react";

interface SimCardData {
  id: string;
  iccid: string;
  telnyxSimId: string;
  status: string;
  name?: string | null;
  liveStatus?: string;
  liveDataUsedMB?: string | number;
}

interface EsimClientProps {
  initialSimCards: SimCardData[];
  esimPrice: number;
  walletBalance: number;
}

export function EsimClient({ initialSimCards, esimPrice, walletBalance }: EsimClientProps) {
  const [simCards, setSimCards] = useState<SimCardData[]>(initialSimCards);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedSimForQr, setSelectedSimForQr] = useState<string | null>(null);
  
  // Renaming state
  const [editingSimId, setEditingSimId] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState("");
  
  const router = useRouter();

  const handlePurchase = async () => {
    if (walletBalance < esimPrice) {
      toast.error(`Solde insuffisant. Le prix est de $${esimPrice.toFixed(2)} mais votre solde est de $${walletBalance.toFixed(2)}.`);
      return;
    }

    if (!confirm(`Confirmez-vous l'achat d'une eSIM pour $${esimPrice.toFixed(2)} ? Ce montant sera débité de votre Wallet.`)) {
      return;
    }

    setPurchasing(true);
    toast.loading("Génération de l'eSIM en cours...", { id: "purchase-esim" });

    const res = await purchaseEsimForUser();
    if (res.success) {
      toast.success("eSIM achetée et ajoutée à votre compte !", { id: "purchase-esim" });
      router.refresh();
      window.location.reload();
    } else {
      toast.error(res.error || "Une erreur est survenue lors de l'achat.", { id: "purchase-esim" });
      setPurchasing(false);
    }
  };

  const handleToggleSim = async (simId: string, currentStatus: string | undefined) => {
    const isEnabling = currentStatus !== 'enabled';
    const confirmMessage = isEnabling 
      ? "Voulez-vous activer cette eSIM ?" 
      : "Voulez-vous suspendre temporairement cette eSIM ?";
    
    if (!confirm(confirmMessage)) return;

    toast.loading(isEnabling ? "Activation en cours..." : "Suspension en cours...", { id: "toggle-sim" });
    const res = await activateMySimCard(simId, isEnabling);

    if (res.success) {
      toast.success(isEnabling ? "eSIM activée !" : "eSIM suspendue.", { id: "toggle-sim" });
      router.refresh();
      window.location.reload();
    } else {
      toast.error(res.error || "Une erreur est survenue.", { id: "toggle-sim" });
    }
  };

  const saveRename = async (telnyxSimId: string) => {
    if (!editNameValue.trim()) return setEditingSimId(null);
    
    toast.loading("Renommage en cours...", { id: "rename-sim" });
    const res = await renameMySimCard(telnyxSimId, editNameValue);
    if (res.success) {
      toast.success("eSIM renommée avec succès !", { id: "rename-sim" });
      setSimCards(prev => prev.map(s => s.telnyxSimId === telnyxSimId ? { ...s, name: editNameValue } : s));
      setEditingSimId(null);
    } else {
      toast.error(res.error || "Erreur lors du renommage.", { id: "rename-sim" });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-scale">
      {/* Overview / Purchase section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 relative overflow-hidden rounded-3xl glass-panel-premium border-[var(--border-subtle)] p-8">
          <div className="absolute top-0 right-0 p-32 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 p-24 bg-violet-500/10 blur-[80px] rounded-full pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] mb-4">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-[10px] font-bold tracking-widest uppercase text-[var(--text-secondary)]">Réseau Global</span>
              </div>
              <h3 className="text-3xl font-black mb-2 tracking-tight">
                Déployez une <span className="brand-gradient-text">eSIM Virtuelle</span>
              </h3>
              <p className="text-sm text-[var(--text-secondary)] max-w-md leading-relaxed">
                Connectivité instantanée, hautement sécurisée. Commandez un profil eSIM professionnel en un clic et scannez le QR code pour activer la ligne.
              </p>
            </div>
            
            <div className="flex flex-col items-center md:items-end w-full md:w-auto bg-[var(--bg-surface-solid)]/50 p-5 rounded-2xl border border-[var(--border-subtle)] backdrop-blur-md shadow-inner">
              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-sm text-[var(--text-secondary)] font-medium">Prix unitaire</span>
                <span className="text-2xl font-black text-[var(--text-primary)] ml-2">${esimPrice.toFixed(2)}</span>
              </div>
              <Button 
                 onClick={handlePurchase} 
                 disabled={purchasing}
                 className="w-full btn-primary-gradient h-11 shadow-[var(--shadow-hover)] hover:shadow-cyan-500/25 transition-all duration-300"
              >
                {purchasing ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Smartphone className="w-4 h-4 mr-2" />}
                Commander
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-3xl glass-panel p-8 flex flex-col justify-center relative overflow-hidden group hover:border-[var(--border-glow)] transition-all duration-500">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <CreditCard className="w-24 h-24" />
          </div>
          <div className="relative z-10">
            <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-3 flex items-center gap-2">
              Solde Wallet
            </h3>
            <div className="text-4xl font-black text-[var(--text-primary)] font-mono tracking-tighter">
              ${walletBalance.toFixed(2)}
            </div>
            <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Votre portefeuille sert à provisionner de nouvelles lignes et payer l'usage data (Pay-as-you-go).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* List of SIM cards */}
      <div className="pt-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-500" />
            Flotte eSIM Déployée
          </h3>
          <div className="text-sm font-medium px-3 py-1 rounded-full bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
            {simCards.length} Ligne{simCards.length !== 1 && 's'}
          </div>
        </div>
        
        {simCards.length === 0 ? (
          <div className="text-center p-16 glass-panel rounded-3xl text-[var(--text-secondary)]">
             <div className="w-16 h-16 rounded-full bg-[var(--bg-surface-hover)] flex items-center justify-center mx-auto mb-4 border border-[var(--border-subtle)] shadow-inner">
               <Smartphone className="w-8 h-8 text-[var(--text-muted)]" />
             </div>
             <h4 className="text-lg font-bold text-[var(--text-primary)] mb-2">Aucune eSIM déployée</h4>
             <p className="text-sm max-w-sm mx-auto">Votre flotte est actuellement vide. Commandez une nouvelle eSIM pour commencer.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {simCards.map((sim, index) => (
              <div 
                key={sim.id} 
                className="glass-panel p-6 rounded-3xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--bg-surface-hover)] flex items-center justify-center border border-[var(--border-subtle)] shadow-sm">
                      <Smartphone className="w-5 h-5 text-cyan-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-full ${sim.liveStatus === 'enabled' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                        <span className="font-bold text-xs uppercase tracking-wider text-[var(--text-primary)]">
                          {sim.liveStatus === 'enabled' ? 'Active' : 'Suspendue'}
                        </span>
                      </div>
                      
                      {editingSimId === sim.telnyxSimId ? (
                        <div className="flex items-center gap-2">
                          <Input 
                            value={editNameValue} 
                            onChange={e => setEditNameValue(e.target.value)}
                            className="h-6 text-[10px] w-32 px-2 py-0"
                            autoFocus
                            onKeyDown={e => {
                              if (e.key === 'Enter') saveRename(sim.telnyxSimId);
                              if (e.key === 'Escape') setEditingSimId(null);
                            }}
                          />
                          <Button size="icon" variant="ghost" className="h-6 w-6 text-emerald-500 hover:text-emerald-400" onClick={() => saveRename(sim.telnyxSimId)}>
                            <Check className="w-3 h-3" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-6 w-6 text-rose-500 hover:text-rose-400" onClick={() => setEditingSimId(null)}>
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 group/edit">
                          <p className="text-[10px] text-[var(--text-muted)] font-medium">
                            {sim.name || "Profil Virtuel"}
                          </p>
                          <button 
                            onClick={() => {
                              setEditNameValue(sim.name || "");
                              setEditingSimId(sim.telnyxSimId);
                            }}
                            className="opacity-0 group-hover/edit:opacity-100 transition-opacity text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mb-6 p-4 rounded-2xl bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] shadow-inner group-hover:border-[var(--border-glow)] transition-colors">
                  <p className="text-[10px] uppercase font-bold text-[var(--text-secondary)] mb-1 tracking-widest">Identifiant ICCID</p>
                  <p className="font-mono text-sm text-[var(--text-primary)] tracking-wide">{sim.iccid.match(/.{1,4}/g)?.join(' ') || sim.iccid}</p>
                </div>

                {/* Jauge Data */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-semibold text-[var(--text-secondary)]">Consommation</span>
                    <span className="text-sm font-black text-[var(--text-primary)] font-mono">{sim.liveDataUsedMB || 0} <span className="text-xs text-[var(--text-muted)]">MB</span></span>
                  </div>
                  <div className="w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-full h-2.5 overflow-hidden shadow-inner">
                    <div 
                       className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full rounded-full relative" 
                       style={{ width: `${Math.min(100, Math.max(3, (Number(sim.liveDataUsedMB || 0) / 1000) * 100))}%` }} 
                    >
                      <div className="absolute top-0 right-0 w-2 h-full bg-white/30 rounded-full" />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t border-[var(--border-subtle)]">
                  <Button 
                     variant="outline" 
                     size="sm"
                     onClick={() => setSelectedSimForQr(sim.telnyxSimId)}
                     className="flex-1 bg-[var(--bg-surface-solid)] border-[var(--border-subtle)] hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all text-xs h-9"
                  >
                    <QrCode className="w-3.5 h-3.5 mr-2 text-cyan-500" /> Installer
                  </Button>
                  <Button 
                     variant="outline" 
                     size="sm"
                     onClick={() => handleToggleSim(sim.telnyxSimId, sim.liveStatus)}
                     className={`flex-1 bg-[var(--bg-surface-solid)] border-[var(--border-subtle)] hover:border-amber-500/50 hover:bg-amber-500/5 transition-all text-xs h-9 ${sim.liveStatus === 'enabled' ? 'hover:text-amber-500' : 'hover:text-emerald-500 hover:border-emerald-500/50 hover:bg-emerald-500/5'}`}
                  >
                    {sim.liveStatus === 'enabled' ? "Suspendre" : "Activer"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal QR Code */}
      <EsimQrDialog 
         open={!!selectedSimForQr}
         onClose={() => setSelectedSimForQr(null)}
         simId={selectedSimForQr}
         fetchActivationCode={getMyActivationCode}
      />
    </div>
  );
}
