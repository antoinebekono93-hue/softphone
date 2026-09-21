"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EsimQrDialogProps {
  open: boolean;
  onClose: () => void;
  simId: string | null;
  fetchActivationCode: (simId: string) => Promise<{ success: boolean; data?: any; error?: string }>;
}

export function EsimQrDialog({ open, onClose, simId, fetchActivationCode }: EsimQrDialogProps) {
  const [activationCode, setActivationCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open && simId) {
      setLoading(true);
      setError(null);
      setActivationCode(null);
      
      fetchActivationCode(simId)
        .then((res) => {
          if (res.success && res.data?.activation_code) {
            setActivationCode(res.data.activation_code);
          } else {
            setError(res.error || "Impossible de récupérer le code d'activation pour cette eSIM.");
          }
        })
        .catch(() => setError("Erreur réseau."))
        .finally(() => setLoading(false));
    }
  }, [open, simId]);

  const handleCopy = () => {
    if (activationCode) {
      navigator.clipboard.writeText(activationCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Activation eSIM"
      description="Scannez ce QR Code pour installer l'eSIM sur votre appareil compatible."
      size="md"
    >
      <div className="flex flex-col items-center justify-center p-4">
        {loading && (
          <div className="flex flex-col items-center gap-4 text-[var(--text-secondary)] py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            <p>Génération du profil...</p>
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center gap-4 text-rose-500 py-12 text-center">
            <AlertCircle className="w-12 h-12" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {activationCode && !loading && (
          <div className="flex flex-col items-center gap-6 w-full">
            <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
              <QRCodeSVG value={activationCode} size={200} level="M" />
            </div>
            
            <div className="w-full space-y-2">
              <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Code d'activation manuel
              </label>
              <div className="flex gap-2 w-full">
                <input
                  readOnly
                  value={activationCode}
                  className="flex-1 px-3 py-2 bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded-lg text-sm font-mono text-[var(--text-primary)] focus:outline-none"
                />
                <Button onClick={handleCopy} className="shrink-0 bg-[var(--bg-surface-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] hover:bg-[var(--bg-surface-solid)]">
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-2">
                Format: LPA:1$sm-dp-plus-server$matching-id
              </p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
