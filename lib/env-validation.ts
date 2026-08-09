const REQUIRED_VARS = [
  'DATABASE_URL',
  'AUTH_SECRET',
  'TELNYX_API_KEY',
  'TELNYX_PUBLIC_KEY',
  'TELNYX_SIP_CONNECTION_ID',
  'OPENAI_API_KEY',
  'NEXT_PUBLIC_PUSHER_KEY',
  'NEXT_PUBLIC_PUSHER_CLUSTER',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'ENCRYPTION_KEY',
  'CRON_SECRET',
] as const;

let hasValidated = false;

export function validateEnv(): void {
  // Ne valider qu'une seule fois
  if (hasValidated) return;
  hasValidated = true;

  // Skip pendant le build Next.js
  if (process.env.NEXT_PHASE === 'phase-production-build' || 
      process.env.NEXT_PHASE === 'phase-development-server') {
    return;
  }

  const missing = REQUIRED_VARS.filter((v) => !process.env[v]);
  if (missing.length > 0) {
    const msg = `Missing required environment variables: ${missing.join(', ')}`;
    console.error('[ENV VALIDATION] CRITICAL:', msg);
    // En production, on loggue mais on ne throw PAS pour éviter de casser toutes les pages
    if (process.env.NODE_ENV !== 'production') {
      throw new Error(msg);
    }
    return;
  }

  const encryptionKey = process.env.ENCRYPTION_KEY;
  if (encryptionKey) {
    try {
      const decoded = Buffer.from(encryptionKey, 'base64');
      if (decoded.length !== 32) {
        throw new Error('ENCRYPTION_KEY must be 32 bytes (base64 encoded)');
      }
    } catch {
      console.error('[ENV VALIDATION] ENCRYPTION_KEY must be valid base64 (32 bytes)');
      if (process.env.NODE_ENV !== 'production') {
        throw new Error('ENCRYPTION_KEY must be valid base64');
      }
    }
  }
}