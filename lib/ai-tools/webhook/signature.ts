import { createHash, createPublicKey, verify, type KeyObject } from 'node:crypto';

/**
 * Vérification de signature Telnyx (schéma officiel des webhooks AI).
 *
 * Telnyx signe chaque webhook — y compris les appels d'outils webhook du
 * assistant — en Ed25519. Le message signé est la concaténation exacte
 * `{telnyx-timestamp}|{raw_body}` (bytes UTF-8 bruts, jamais re-sérialisés).
 * Les entêtes sont `telnyx-signature-ed25519` (une ou plusieurs signatures
 * base64 séparées par des espaces pour la rotation de clé) et `telnyx-timestamp`
 * (secondes Unix). La clé publique du compte est fournie par l'opérateur via
 * God Mode / TELNYX_PUBLIC_KEY.
 *
 * Ce module est l'UNIQUE primitive de vérification d'écriture du webhook AI.
 * `client.webhooks.unwrap` (standardwebhooks/HMAC `msgId.timestamp.payload`)
 * ne correspond PAS au schéma Ed25519 de Telnyx et n'est pas utilisé ici.
 * `constructEvent` n'existe pas dans le SDK v7.2.0 installé — les routes
 * telecom/whatsapp le référencent pourtant (à documenter séparément).
 */

export const TELNYX_SIGNATURE_HEADER = 'telnyx-signature-ed25519';
export const TELNYX_TIMESTAMP_HEADER = 'telnyx-timestamp';

/**
 * Fenêtre d'horloge acceptée de part et d'autre, en secondes (5 minutes).
 * Aligne la tolérance de la spec Standard Webhooks et de la doc Telnyx Edge
 * (maxSkew). Choix documenté : constant, jamais arbitraire.
 */
export const TELNYX_WEBHOOK_MAX_SKEW_SECONDS = 300;

export type TelnyxSignatureRejection =
  | 'MISSING_SIGNATURE'
  | 'MISSING_TIMESTAMP'
  | 'INVALID_TIMESTAMP'
  | 'TIMESTAMP_TOO_OLD'
  | 'TIMESTAMP_TOO_FUTURE'
  | 'INVALID_PUBLIC_KEY'
  | 'SIGNATURE_MISMATCH';

/**
 * Fail-closed : toute absence / format invalide / divergence renvoie ok:false.
 * En cas de succès, `timestamp` est la valeur exacte de l'entête ligne utilisée
 * pour la signature (nécessaire au dérivé de clé anti-rejeu).
 */
export type TelnyxSignatureVerdict =
  | { ok: true; timestamp: string }
  | { ok: false; reason: TelnyxSignatureRejection };

const ED25519_SUBJECT_PUBLIC_KEY_PREFIX = '302a300506032b6570032100';

function buildPublicKey(raw: string): KeyObject {
  const trimmed = raw.trim();
  if (trimmed.includes('BEGIN')) {
    return createPublicKey(trimmed);
  }
  const decoded = Buffer.from(trimmed, 'base64');
  if (decoded.length !== 32) throw new Error('Invalid ed25519 public key length');
  const spki = Buffer.concat([
    Buffer.from(ED25519_SUBJECT_PUBLIC_KEY_PREFIX, 'hex'),
    decoded,
  ]);
  return createPublicKey({ key: spki, format: 'der', type: 'spki' });
}

function headerMap(headers: Record<string, string | undefined>): Record<string, string | undefined> {
  const lower: Record<string, string | undefined> = {};
  for (const key of Object.keys(headers)) {
    lower[key.toLowerCase()] = headers[key];
  }
  return lower;
}

/**
 * Vérifie la signature Ed25519 du body brut. Ordre strict : entêtes présents,
 * timestamp interprétable, fenêtre d'horloge, puis signature(s) base64.
 * La comparaison est effectuée par OpenSSL (EVP_DigestVerify) en temps
 * constant sur le digest ; aucune réorganisation du body n'est tolérée.
 */
export function verifyTelnyxWebhookSignature(
  rawBody: string,
  headers: Record<string, string | undefined>,
  publicKey: string,
  now: number = Date.now()
): TelnyxSignatureVerdict {
  const lower = headerMap(headers);
  const signatureHeader = lower[TELNYX_SIGNATURE_HEADER];
  const timestampHeader = lower[TELNYX_TIMESTAMP_HEADER];
  if (!signatureHeader) return { ok: false, reason: 'MISSING_SIGNATURE' };
  if (!timestampHeader) return { ok: false, reason: 'MISSING_TIMESTAMP' };
  if (!/^\d{1,19}$/.test(timestampHeader)) return { ok: false, reason: 'INVALID_TIMESTAMP' };

  const timestampSeconds = Number(timestampHeader);
  const nowSeconds = Math.floor(now / 1000);
  if (nowSeconds - timestampSeconds > TELNYX_WEBHOOK_MAX_SKEW_SECONDS) {
    return { ok: false, reason: 'TIMESTAMP_TOO_OLD' };
  }
  if (timestampSeconds - nowSeconds > TELNYX_WEBHOOK_MAX_SKEW_SECONDS) {
    return { ok: false, reason: 'TIMESTAMP_TOO_FUTURE' };
  }

  let keyObject: KeyObject;
  try {
    keyObject = buildPublicKey(publicKey);
  } catch {
    return { ok: false, reason: 'INVALID_PUBLIC_KEY' };
  }

  const signed = Buffer.from(`${timestampHeader}|${rawBody}`, 'utf8');
  const candidates = signatureHeader.split(/\s+/).filter(Boolean);
  for (const candidate of candidates) {
    let decoded: Buffer | null = null;
    try {
      decoded = Buffer.from(candidate, 'base64');
    } catch {
      decoded = null;
    }
    if (!decoded || decoded.length !== 64) continue;
    try {
      if (verify(null, signed, keyObject, decoded)) {
        return { ok: true, timestamp: timestampHeader };
      }
    } catch {
      return { ok: false, reason: 'SIGNATURE_MISMATCH' };
    }
  }
  return { ok: false, reason: 'SIGNATURE_MISMATCH' };
}

/**
 * Clé déterministe d'idempotence pour le webhook tool : hash sha256 de
 * l'exacte message signé. Deux livraisons strictement identiques (même body,
 * même timestamp → même signature) produisent la même clé et sont dédupliquées.
 */
export function deriveTelnyxAIToolReplayKey(timestampHeader: string, rawBody: string): string {
  return createHash('sha256')
    .update(`${timestampHeader}|${rawBody}`, 'utf8')
    .digest('hex');
}