export function TelnyxKeyForm({ defaultValue: _defaultValue }: { defaultValue: string }) {
  return (
    <div className="mb-6 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 text-sm text-[var(--text-secondary)]">
      L’accès Telnyx est administré centralement. Les comptes clients n’utilisent et ne reçoivent jamais la clé maître.
    </div>
  );
}
