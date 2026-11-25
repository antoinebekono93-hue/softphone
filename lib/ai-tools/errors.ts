export type AIToolErrorCode =
  | 'NOT_FOUND'
  | 'NOT_ALLOWED'
  | 'INVALID_ARGUMENTS'
  | 'TEMPORARILY_UNAVAILABLE'
  | 'TIME_SLOT_UNAVAILABLE'
  | 'TIME_OUTSIDE_BUSINESS_HOURS'
  | 'CUSTOMER_NOT_FOUND'
  | 'LEAD_NOT_FOUND'
  | 'LEAD_ALREADY_EXISTS'
  | 'LEAD_AMBIGUOUS'
  | 'INVALID_STAGE'
  | 'WRITE_TOOL_NOT_ALLOWED'
  | 'RECIPIENT_NOT_FOUND'
  | 'RECIPIENT_HAS_NO_PHONE'
  | 'RECIPIENT_OPTED_OUT'
  | 'INVALID_DESTINATION'
  | 'SMS_SENDER_UNAVAILABLE'
  | 'SMS_SEND_FAILED';

/**
 * Données structurées facultatives jointes à un échec contrôlé. Non sensibles :
 * uniquement un fuseau IANA, des instants ISO et des fenêtres candidates. Aucun
 * identifiant tenant, aucun PII, aucun détail Prisma.
 */
export interface AIToolErrorDetails {
  timezone?: string;
  requestedStart?: string;
  requestedEnd?: string;
  /** Fenêtres candidates ISO (aperçu borné), jamais un rendez-vous implicite. */
  nextAvailableWindows?: string[];
  /** Identifiant public d'un lead existant (jamais un identifiant tenant). */
  leadId?: string;
  /** Nombre de leads correspondants lors d'une résolution ambiguë bornée. */
  matchCount?: number;
}

/**
 * Error contract returned to the LLM. Only the codes above ever cross the
 * boundary: Prisma errors, stack traces, schema details and tenant ids are
 * never exposed. The business-specific codes are the write-tool outcomes
 * (Phase 4A create_appointment and Phase 4A.2 business hours).
 */
export class AIToolError extends Error {
  readonly code: AIToolErrorCode;
  readonly details?: AIToolErrorDetails;

  constructor(
    code: AIToolErrorCode,
    message?: string,
    details?: AIToolErrorDetails
  ) {
    super(message ?? code);
    this.name = 'AIToolError';
    this.code = code;
    this.details = details;
  }
}

export function toSafeErrorCode(error: unknown): AIToolErrorCode {
  return error instanceof AIToolError ? error.code : 'TEMPORARILY_UNAVAILABLE';
}

export function toSafeErrorDetails(
  error: unknown
): AIToolErrorDetails | undefined {
  return error instanceof AIToolError ? error.details : undefined;
}
