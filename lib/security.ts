import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-fallback-key-change-in-production-123!';

/**
 * Security as a Feature: Chiffrement AES-256
 * Utilisé pour chiffrer les faits extraits et les logs sensibles avant insertion en DB.
 */
export function encryptData(text: string): string {
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
}

export function decryptData(cipherText: string): string {
  const bytes = CryptoJS.AES.decrypt(cipherText, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

/**
 * Masquage PII (Personally Identifiable Information)
 * Remplace dynamiquement les emails, numéros de SSN, et cartes bancaires.
 */
export function maskPII(text: string): string {
  if (!text) return text;
  
  // Masquer les emails (ex: john.doe@example.com -> j***@example.com)
  let masked = text.replace(/([a-zA-Z0-9._-]+)@([a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi, (match, p1, p2) => {
    return `${p1[0]}***@${p2}`;
  });

  // Masquer les numéros de carte bancaire (16 chiffres consécutifs ou séparés par des espaces/tirets)
  masked = masked.replace(/(?:\d[ -]*?){13,16}/g, '****-****-****-****');

  // Masquer les numéros de sécurité sociale français (15 chiffres commençant par 1 ou 2)
  masked = masked.replace(/\b[12]\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{3}\s?\d{3}\s?\d{2}\b/g, '[SSN MASQUÉ]');

  return masked;
}
