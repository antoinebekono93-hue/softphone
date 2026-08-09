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

export function validateEnv(): void {
  // Skip validation during Next.js build (static generation)
  if (process.env.NEXT_PHASE === 'phase-production-build' || 
      process.env.NEXT_PHASE === 'phase-development-server' ||
      process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
    return;
  }

  const missing = REQUIRED_VARS.filter((v) => !process.env[v]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  const encryptionKey = process.env.ENCRYPTION_KEY;
  if (encryptionKey) {
    try {
      const decoded = Buffer.from(encryptionKey, 'base64');
      if (decoded.length !== 32) {
        throw new Error('ENCRYPTION_KEY must be 32 bytes (base64 encoded)');
      }
    } catch {
      throw new Error('ENCRYPTION_KEY must be valid base64');
    }
  }
}