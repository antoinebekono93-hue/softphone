import { AsYouType } from "libphonenumber-js";
import { formatDateFR, formatPhoneNumber, formatTimeFR } from "@/lib/utils";

/**
 * Types de présentation partagés par l'interface mobile « app Téléphone ».
 * Ces types ne dupliquent aucune logique métier : ils décrivent uniquement les
 * formes de données réellement renvoyées par /api/calls, /api/contacts et
 * /api/voicemails (voir SoftphoneWorkspace / IncomingCall).
 */

export interface PhoneContact {
  id: string;
  name?: string | null;
  company?: string | null;
  email?: string | null;
  phone: string;
  isVip?: boolean;
  totalSpent?: number;
  purchaseCount?: number;
  leadScore?: number | null;
  sentiment?: string | null;
  groups?: { id: string; name: string }[];
}

export interface PhoneCall {
  id: string;
  direction?: string | null;
  status?: string | null;
  fromNumber?: string | null;
  toNumber?: string | null;
  startedAt?: string | Date | null;
  duration?: number | null;
}

export interface PhoneVoicemail {
  id: string;
  fromNumber?: string | null;
  toNumber?: string | null;
  startedAt?: string | Date | null;
  duration?: number | null;
  transcriptionText?: string | null;
  audioUrl: string;
}

/** Initiales d'affichage (1 à 2 lettres) pour l'avatar circulaire. */
export function initials(value?: string | null): string {
  const name = (value ?? "").trim();
  if (!name) return "#";
  const parts = name.split(/\s+/).filter(Boolean).slice(0, 2);
  const letters = parts.map((p) => p.charAt(0).toUpperCase()).join("");
  return letters || "#";
}

/** Ne conserve que les chiffres (comparaison de numéros). */
export function digitsOnly(value?: string | null): string {
  return (value ?? "").replace(/\D/g, "");
}

/**
 * Rapproche un numéro d'un contact par correspondance de chiffres. On teste
 * l'égalité stricte puis la correspondance des 9/10 derniers chiffres afin de
 * tolérer les différences de format (E.164 vs national).
 */
export function matchContact(
  contacts: PhoneContact[],
  number?: string | null,
): PhoneContact | null {
  const target = digitsOnly(number);
  if (!target) return null;
  for (const contact of contacts) {
    const candidate = digitsOnly(contact.phone);
    if (!candidate) continue;
    if (candidate === target) return contact;
    const tail = Math.min(candidate.length, target.length, 10);
    if (tail >= 7 && candidate.slice(-tail) === target.slice(-tail)) return contact;
  }
  return null;
}

/** Nom affichable pour un contact (jamais vide). */
export function contactName(contact?: PhoneContact | null): string {
  const name = contact?.name?.trim();
  if (name) return name;
  if (contact?.phone) return formatPhoneNumber(contact.phone);
  return "Sans nom";
}

/** Contact « favori » dérivé : VIP explicite ou client à forte valeur. */
export function isFavoriteContact(contact: PhoneContact): boolean {
  return contact.isVip === true || (contact.totalSpent ?? 0) >= 1000;
}

/**
 * Formatage « au fil de la frappe » identique à l'app Téléphone iOS, basé sur
 * libphonenumber-js (déjà présent dans le projet). Repli sur la valeur brute si
 * le numéro est trop incomplet pour être interprété.
 */
export function formatDialerDisplay(raw: string, defaultIso?: string): string {
  if (!raw) return "";
  try {
    const formatted = new AsYouType(defaultIso as never).input(raw);
    return formatted || raw;
  } catch {
    return raw;
  }
}

export function callDirectionOf(call: PhoneCall): "inbound" | "outbound" {
  const dir = String(call.direction ?? "").toLowerCase();
  return dir === "inbound" || dir === "incoming" ? "inbound" : "outbound";
}

/** Un appel manqué est un appel entrant sans réponse (PSTN) ou statut MISSED. */
export function isMissedCall(call: PhoneCall): boolean {
  if (callDirectionOf(call) !== "inbound") return false;
  const status = String(call.status ?? "").toUpperCase();
  return status === "MISSED" || status === "NO_ANSWER";
}

/** Numéro de l'interlocuteur (l'autre bout du fil). */
export function counterpartyNumber(call: PhoneCall): string {
  const inbound = callDirectionOf(call) === "inbound";
  return (inbound ? call.fromNumber : call.toNumber) || call.fromNumber || call.toNumber || "";
}

/** Nom lisible d'un appel : contact si connu, sinon numéro formaté. */
export function callDisplayName(call: PhoneCall, contacts: PhoneContact[]): string {
  const number = counterpartyNumber(call);
  const contact = matchContact(contacts, number);
  if (contact) return contactName(contact);
  return number ? formatPhoneNumber(number) : "Numéro inconnu";
}

export function callKindLabel(call: PhoneCall): "Manqué" | "Entrant" | "Sortant" {
  if (isMissedCall(call)) return "Manqué";
  return callDirectionOf(call) === "inbound" ? "Entrant" : "Sortant";
}

export function callDurationLabel(call: PhoneCall): string | null {
  const seconds = Number(call.duration ?? 0);
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins <= 0) return `${secs} s`;
  return `${mins} min ${secs.toString().padStart(2, "0")} s`;
}

/** Horodatage « Récents » type iOS : heure si aujourd'hui, sinon jour/date. */
export function recentTimestampLabel(value: PhoneCall["startedAt"]): string {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (sameDay) return formatTimeFR(date);
  return formatDateFR(date);
}

/** Groupe alphabétique d'un contact (A-Z, sinon #). */
export function alphabeticalKey(contact: PhoneContact): string {
  const base = (contact.name?.trim() || "#").charAt(0).toUpperCase();
  return /[A-Z]/.test(base) ? base : "#";
}
