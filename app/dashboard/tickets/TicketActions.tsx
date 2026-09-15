"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, Star } from "lucide-react";

export default function TicketActions({ 
  ticketId, 
  status, 
  csatScore 
}: { 
  ticketId: string; 
  status: string;
  csatScore: number | null;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleResolve = async () => {
    setIsLoading(true);
    const toastId = toast.loading("Résolution du ticket et envoi CSAT...");
    
    try {
      const res = await fetch(`/api/tickets/${ticketId}/resolve`, {
        method: "POST"
      });
      
      if (!res.ok) throw new Error("Erreur de résolution");
      
      toast.success("Ticket résolu ! Demande d'évaluation envoyée au client.", { id: toastId });
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Échec de la résolution.", { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        {status !== 'RESOLVED' && status !== 'CLOSED' && (
          <button 
            onClick={handleResolve}
            disabled={isLoading}
            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            Résoudre & CSAT
          </button>
        )}
        <button className="px-4 py-2 bg-[var(--bg-surface-solid)] text-[var(--text-primary)] text-sm font-medium rounded-md hover:bg-[var(--bg-surface-hover)] transition-colors">
          Prendre en charge
        </button>
      </div>

      {csatScore !== null && (
        <div className="flex items-center gap-1 mt-2 text-yellow-500 bg-yellow-500/10 px-3 py-1 rounded-full text-sm font-medium border border-yellow-500/20">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className={`w-4 h-4 ${i < csatScore ? 'fill-current' : 'text-[var(--text-muted)]'}`} />
          ))}
          <span className="ml-1 text-[var(--text-secondary)]">Client satisfait</span>
        </div>
      )}
    </div>
  );
}
