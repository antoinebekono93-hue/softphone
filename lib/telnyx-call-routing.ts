import { createHash } from "node:crypto";

/**
 * Routage Telnyx — classification des `call.initiated` et construction
 * déterministe des commandes de transfert.
 *
 * Module PUR : aucune dépendance Prisma / env. Tous les faits asynchrones
 * (numéro géré, existence de la jambe source) sont résolus par l'appelant et
 * passés en entrée des fonctions pures.
 */

export const TELNYX_TRANSFER_KIND = "AI_LIVEKIT_TRANSFER";
export const TELNYX_TRANSFER_VERSION = 1;

export type TelnyxLegKind =
  | "INBOUND_CUSTOMER"
  | "OUTBOUND_MANAGED"
  | "TRANSFER_CHILD_LEG"
  | "CAMPAIGN_OUTBOUND"
  | "WEBRTC_OUTBOUND"
  | "UNKNOWN";

export interface TelnyxCallInitiatedInput {
  /** direction exacte du payload Telnyx (`incoming` / `outgoing`). */
  direction: string;
  /** `connection_id` du payload (null si absent). */
  connectionId: string | null;
  /** connection_id attendu de l'app (null si non configuré). */
  expectedConnectionId: string | null;
  /** client_state décodée (objet), null si absente/invalide. */
  clientState: Record<string, unknown> | null;
  /** true si `payload.from` (leg sortant) correspond à un numéro géré actif. */
  managedCallerFrom?: boolean;
  /** true si `payload.to` (leg entrant) correspond à un numéro géré actif. */
  managedNumberTo?: boolean;
  /**
   * Vrai uniquement si, en plus d'un client_state de type transfert, la jambe
   * source référencée existe réellement en base et est celle attendue.
   * Ne jamais passer `true` quand le client_state n'est pas de type transfert.
   */
  transferSourceLegExists?: boolean;
}

/**
 * Classification explicite d'un `call.initiated`. Règles — par ordre de
 * priorité :
 *  1. Entrant : selon que le `to` est un numéro géré actif.
 *  2. Sortant : EXIGE `connection_id` conforme, puis :
 *     a. `TRANSFER_CHILD_LEG` uniquement si client_state de type transfert
 *        **et** source vérifiée en base.
 *     b. `CAMPAIGN_OUTBOUND` / `WEBRTC_OUTBOUND` si client_state reconnue et
 *        caller géré.
 *     c. `OUTBOUND_MANAGED` si caller géré.
 *     d. `UNKNOWN` sinon (fail-closed : l'appelant décide de NE PAS agir).
 *
 * Ne classe JAMAIS uniquement par `from`/`to`/direction textuelle.
 */
export function classifyTelnyxCallInitiated(input: TelnyxCallInitiatedInput): TelnyxLegKind {
  const direction = typeof input.direction === "string" ? input.direction.trim().toLowerCase() : "";

  if (direction === "incoming") {
    return input.managedNumberTo === true ? "INBOUND_CUSTOMER" : "UNKNOWN";
  }

  if (direction !== "outgoing") return "UNKNOWN";

  const connectionOk =
    typeof input.expectedConnectionId === "string" &&
    input.expectedConnectionId.length > 0 &&
    typeof input.connectionId === "string" &&
    input.connectionId === input.expectedConnectionId;

  // Fail-closed : on ne pilote que les legs de NOTRE connexion.
  if (!connectionOk) return "UNKNOWN";

  const cs = input.clientState && typeof input.clientState === "object" && !Array.isArray(input.clientState)
    ? input.clientState
    : null;

  const looksLikeTransfer = !!cs &&
    cs[TELNYX_TRANSFER_KIND_LOOKUP] === TELNYX_TRANSFER_KIND &&
    typeof cs["sourceCallControlId"] === "string" &&
    (cs["sourceCallControlId"] as string).length > 0 &&
    typeof cs["sourceCallLogId"] === "string" &&
    (cs["sourceCallLogId"] as string).length > 0;

  if (looksLikeTransfer) {
    // La vérification du caller DOIT être passée par l'appelant (base). Sans
    // elle, on ne fait pas confiance à un simple `call_session_id`.
    return input.transferSourceLegExists === true ? "TRANSFER_CHILD_LEG" : "UNKNOWN";
  }

  if (typeof cs?.["campaignId"] === "string") {
    return input.managedCallerFrom === true ? "CAMPAIGN_OUTBOUND" : "UNKNOWN";
  }
  if (typeof cs?.["outboundAttemptId"] === "string") {
    return input.managedCallerFrom === true ? "WEBRTC_OUTBOUND" : "UNKNOWN";
  }

  return input.managedCallerFrom === true ? "OUTBOUND_MANAGED" : "UNKNOWN";
}

const TELNYX_TRANSFER_KIND_LOOKUP = "kind";

/**
 * Client_state structuré pour un transfert AI → LiveKit.
 * `target = true` produit le `target_leg_client_state` (état porté par les
 * webhooks de la NOUVELLE jambe) ; sinon le `client_state` (jambe source).
 * Ne contient aucun secret. Base64 (format requis par Telnyx).
 */
export function buildTelnyxTransferClientState(input: {
  sourceCallControlId: string;
  sourceCallLogId: string;
  organizationId: string;
  purpose: string;
  target: boolean;
}): string {
  const payload = {
    kind: TELNYX_TRANSFER_KIND,
    v: TELNYX_TRANSFER_VERSION,
    sourceCallControlId: input.sourceCallControlId,
    sourceCallLogId: input.sourceCallLogId,
    organizationId: input.organizationId,
    purpose: input.purpose,
    ...(input.target ? { target: true } : {}),
  };
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64");
}

/**
 * command_id DÉTERMINISTE d'une intention de transfert. Identique pour le
 * même (source, cible, but) → Telnyx ignore les doublons 60 s ; un replay
 * d'un même transfert réutilise donc la même commande.
 */
export function buildTelnyxTransferCommandId(input: {
  sourceCallControlId: string;
  target: string;
  purpose: string;
}): string {
  const targetHash = createHash("sha256").update(input.target).digest("hex").slice(0, 16);
  const purpose = input.purpose || "default";
  if (typeof input.sourceCallControlId !== "string" || input.sourceCallControlId.length === 0) {
    throw new Error("buildTelnyxTransferCommandId: sourceCallControlId requis");
  }
  return `transfer:${input.sourceCallControlId}:${purpose}:${targetHash}`;
}

/**
 * Garde facturation/mutation pour une jambe enfant de transfert : jamais de
 * seconde réservation ni de settlement côté application.
 */
export function isTelnyxTransferChildLeg(call: {
  direction: string;
  callPurpose: string;
}): boolean {
  return call.direction === "TRANSFER" || call.callPurpose === "AI_TRANSFER";
}

/**
 * Garde « UNMANAGED_CALLER_ID » : seul un leg sortant réellement géré et
 * non reconnu comme enfant de transfert peut être raccroché faute de caller
 * ID géré. Une jambe `TRANSFER_CHILD_LEG` ne déclenche JAMAIS cette garde.
 */
export function shouldRejectUnmanagedOutbound(input: {
  kind: TelnyxLegKind;
  managedCallerFrom: boolean;
}): boolean {
  if (input.kind === "TRANSFER_CHILD_LEG") return false;
  if (input.kind === "UNKNOWN") return false;
  return input.managedCallerFrom !== true;
}

/**
 * Seuls les legs réellement générateurs de débit reçoivent une réservation /
 * un settlement applicatif. La jambe enfant de transfert et les legs non
 * classés sont exclus (le coût Telnyx de la jambe B est de l'infra AI).
 */
export function requiresPstnReservation(kind: TelnyxLegKind): boolean {
  switch (kind) {
    case "INBOUND_CUSTOMER":
    case "OUTBOUND_MANAGED":
    case "CAMPAIGN_OUTBOUND":
    case "WEBRTC_OUTBOUND":
      return true;
    case "TRANSFER_CHILD_LEG":
    case "UNKNOWN":
      return false;
    default:
      return false;
  }
}