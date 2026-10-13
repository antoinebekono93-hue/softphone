"use client";

/**
 * Grand titre de section type iOS (« Récents », « Contacts », « Favoris »…).
 * Une caption discrète « Buster Call » rappelle la marque sans surcharge.
 */
export function ScreenTitle({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between px-4 pb-2 pt-2">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--brand)]">
          Buster Call
        </p>
        <h1 className="text-[34px] font-bold leading-tight tracking-tight text-[var(--text-primary)]">
          {title}
        </h1>
      </div>
      {action}
    </div>
  );
}
