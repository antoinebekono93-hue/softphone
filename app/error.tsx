"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mb-6">
        <svg className="w-8 h-8 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Une erreur est survenue</h2>
      <p className="text-[var(--text-secondary)] mb-6 max-w-md">
        Quelque chose s'est mal passé. L'erreur a été signalée à notre équipe.
      </p>
      <div className="flex gap-4">
        <Button onClick={reset} className="btn-primary-gradient">
          Réessayer
        </Button>
        <Button variant="outline" onClick={() => window.location.href = "/dashboard"}>
          Retour au tableau de bord
        </Button>
      </div>
      {process.env.NODE_ENV === "development" && (
        <details className="mt-8 text-left w-full max-w-md">
          <summary className="text-sm font-medium text-[var(--text-secondary)] cursor-pointer">
            Détails techniques (développement)
          </summary>
          <pre className="mt-4 p-4 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg text-xs overflow-auto whitespace-pre-wrap text-[var(--text-secondary)]">
            {error.message}
            {error.stack && `\n\n${error.stack}`}
          </pre>
        </details>
      )}
    </div>
  );
}