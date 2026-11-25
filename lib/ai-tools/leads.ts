import { createHash } from 'node:crypto';

/**
 * Port d'écriture des leads (CRM) + orchestration PURE (Phase 4B).
 *
 * Un « lead » est représenté par le modèle canonique `Contact` (voir l'audit
 * Phase 4B) : `@@unique([organizationId, phone])` fournit la garantie
 * anti-doublon au niveau base. Ce module ne contient AUCUN accès base :
 * l'implémentation Prisma vit hors de `lib/ai-tools`
 * (voir `lib/crm-writer-prisma.ts`) afin que `lib/ai-tools` reste sans écriture
 * Prisma (test statique J1). Les handlers dépendent de l'interface `LeadWriter`.
 */

export interface LeadRecord {
  id: string;
  organizationId: string;
  name: string | null;
  company: string | null;
  email: string | null;
  phone: string;
  notes: string | null;
  leadScore: number | null;
  sentiment: string | null;
  escalationStatus: string | null;
  optedOut: boolean;
  isVip: boolean;
}

/** Identité minimale renvoyée par une recherche téléphone (résolution §11). */
export interface LeadIdentity {
  id: string;
  phone: string;
}

export interface CreateLeadInput {
  organizationId: string;
  name: string | null;
  company: string | null;
  email: string | null;
  /** Numéro canonique E.164 (jamais un format de présentation). */
  phone: string;
  notes: string | null;
}

export interface UpdateLeadInput {
  organizationId: string;
  contactId: string;
  /** Champs facultatifs : `undefined` = ne pas modifier. */
  name?: string;
  company?: string;
  email?: string;
  /** Texte AJOUTÉ aux notes existantes (jamais un remplacement). */
  notesAppend?: string;
}

export type CreateLeadOutcome =
  | { status: 'CREATED'; lead: LeadRecord }
  | { status: 'DUPLICATE'; lead: LeadRecord }
  | { status: 'UNAVAILABLE' };

export type UpdateLeadOutcome =
  | { status: 'UPDATED'; lead: LeadRecord }
  | { status: 'NOT_FOUND' }
  | { status: 'UNAVAILABLE' };

export type LeadResolution =
  | { status: 'FOUND'; lead: LeadIdentity }
  | { status: 'NOT_FOUND' }
  | { status: 'AMBIGUOUS'; count: number };

/**
 * Toutes les opérations sont scopées par `organizationId` : l'identité d'un
 * lead inclut toujours son tenant. Aucune méthode n'accepte un id seul.
 */
export interface LeadWriter {
  /**
   * Insère un nouveau lead. Repose sur la contrainte unique
   * `(organizationId, phone)` : sous création concurrente, exactement une
   * insertion réussit et l'autre est réconciliée en `DUPLICATE`.
   */
  createLead(input: CreateLeadInput): Promise<CreateLeadOutcome>;
  /** Recherche par formats téléphone, scopée par organisation. */
  findContactsByPhone(
    organizationId: string,
    candidates: readonly string[]
  ): Promise<LeadIdentity[]>;
  /** Lecture d'un lead par id, scopée par organisation. */
  getLead(organizationId: string, contactId: string): Promise<LeadRecord | null>;
  /** Met à jour un lead existant ; les notes sont AJOUTÉES, jamais écrasées. */
  updateLead(input: UpdateLeadInput): Promise<UpdateLeadOutcome>;
}

/** Politique de retry bornée appliquée aux échecs de sérialisation. */
export interface RetryPolicy {
  /** Nombre TOTAL de tentatives (≥ 1). */
  maxAttempts: number;
  backoffMs: (attempt: number) => number;
  sleep: (ms: number) => Promise<void>;
  /** Vrai uniquement pour un échec de sérialisation/deadlock réessayable. */
  isRetryable: (error: unknown) => boolean;
}

export interface LeadUpdateExecutor {
  /** Exécute la mise à jour atomique dans une transaction sérialisable. */
  runTransaction: () => Promise<UpdateLeadOutcome>;
  policy: RetryPolicy;
}

/**
 * Exécute la mise à jour avec retry BORNÉ. Ne réessaie QUE les échecs de
 * sérialisation. Épuisement des tentatives ⇒ `UNAVAILABLE`, résultat contrôlé
 * (jamais une erreur de base exposée).
 */
export async function executeLeadUpdate(
  input: UpdateLeadInput,
  executor: LeadUpdateExecutor
): Promise<UpdateLeadOutcome> {
  void input;
  for (let attempt = 1; attempt <= executor.policy.maxAttempts; attempt++) {
    try {
      return await executor.runTransaction();
    } catch (error) {
      if (!executor.policy.isRetryable(error)) throw error;
      if (attempt >= executor.policy.maxAttempts) return { status: 'UNAVAILABLE' };
      await executor.policy.sleep(executor.policy.backoffMs(attempt));
    }
  }
  return { status: 'UNAVAILABLE' };
}

/**
 * Résolution téléphone déterministe (§11) : 0 correspondance → `NOT_FOUND`,
 * exactement 1 → `FOUND`, plus d'une → `AMBIGUOUS` (aucune fusion implicite).
 */
export function resolveLeadByPhone(candidates: readonly LeadIdentity[]): LeadResolution {
  if (candidates.length === 0) return { status: 'NOT_FOUND' };
  if (candidates.length > 1) return { status: 'AMBIGUOUS', count: candidates.length };
  return { status: 'FOUND', lead: candidates[0] };
}

/**
 * Concatène une nouvelle note aux notes existantes sans jamais supprimer
 * l'historique. Un contenu vide ne modifie rien.
 */
export function appendNote(existing: string | null, addition: string): string {
  const trimmed = addition.trim();
  if (!trimmed) return existing ?? '';
  const base = (existing ?? '').trim();
  return base ? `${base}\n\n${trimmed}` : trimmed;
}

/**
 * Clé d'idempotence sémantique pour `create_lead`. Quand Telnyx fournit un
 * `request_id` stable, un rejeu retombe sur la même clé ; sinon on retombe sur
 * un hash du numéro canonique, afin qu'un rejeu ne crée jamais de doublon.
 */
export function buildLeadIdempotencyKey(params: {
  organizationId: string;
  requestId: string | null;
  phone: string;
}): string {
  const prefix = `${params.organizationId}:create_lead`;
  if (params.requestId) return `${prefix}:req:${params.requestId}`;
  const hash = createHash('sha256').update(params.phone, 'utf8').digest('hex');
  return `${prefix}:sem:${hash}`;
}
