import CryptoJS from "crypto-js";
import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

function getEncryptionKey(): string {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error("ENCRYPTION_KEY is not defined in environment variables");
  }
  return key;
}

/**
 * Security as a Feature: Chiffrement AES-256
 * Utilisé pour chiffrer les faits extraits et les logs sensibles avant insertion en DB.
 */
export function encryptData(text: string): string {
  return CryptoJS.AES.encrypt(text, getEncryptionKey()).toString();
}

export function decryptData(cipherText: string): string {
  const bytes = CryptoJS.AES.decrypt(cipherText, getEncryptionKey());
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
  masked = masked.replace(/(?:\d[ -]*?){13,16}/g, "****-****-****-****");

  // Masquer les numéros de sécurité sociale français (15 chiffres commençant par 1 ou 2)
  masked = masked.replace(/\b[12]\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{3}\s?\d{3}\s?\d{2}\b/g, "[SSN MASQUÉ]");

  return masked;
}

// ============================================================================
// Gardes d'autorisation centralisées pour god-mode / admin / cron
//
// Le modèle d'autorisation est :
//   - `session.user.isSuperAdmin` (booléen, tiré de la base au login).
//   - Le champ libre `User.role` ne DOIT PAS servir de source de vérité
//     (String libre, jamais "SUPER_ADMIN" dans la pratique).
// ============================================================================

export class AuthReqError extends Error {}

export async function requireSuperAdmin(): Promise<void> {
  const session = await auth();
  if (!session?.user?.isSuperAdmin) {
    throw new AuthReqError("Non autorisé");
  }
}

/**
 * Alias conforme au contrat d'audit : vérifie l'autorisation serveur réelle
 * (`session.user.isSuperAdmin`, booléen issu de la base au login).
 */
export async function assertSuperAdmin(): Promise<void> {
  return requireSuperAdmin();
}

/**
 * Vérifie qu'un utilisateur connecté appartient bien à une organisation.
 * Optionnellement, impose une organisation cible (anti cross-tenant).
 */
export async function assertOrgMember(expectedOrgId?: string): Promise<string> {
  const session = await auth();
  if (!session?.user?.organizationId) {
    throw new AuthReqError("Non autorisé");
  }
  if (expectedOrgId && session.user.organizationId !== expectedOrgId) {
    throw new AuthReqError("Non autorisé");
  }
  return session.user.organizationId;
}

export async function requireSuperAdminApi(): Promise<NextResponse | null> {
  const session = await auth();
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

/**
 * Comparaison de secrets à temps constant (digest sha-256 + timingSafeEqual).
 */
export function constantTimeCompare(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

/**
 * Garde des routes cron.
 *  - En production : fail-closed. Un CRON_SECRET doit être configuré, sinon
 *    toutes les requêtes sont refusées (401).
 *  - En dev : si aucun CRON_SECRET n'est configuré, on laisse passer ;
 *    dès qu'il existe, il est exigé.
 */
export function requireCronSecret(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  const expected = `Bearer ${secret ?? ""}`;
  const actual = req.headers.get("authorization") ?? "";

  if (process.env.NODE_ENV === "production") {
    if (!secret) return false;
    return constantTimeCompare(actual, expected);
  }

  if (!secret) return true;
  return constantTimeCompare(actual, expected);
}