export type AIToolErrorCode =
  | 'NOT_FOUND'
  | 'NOT_ALLOWED'
  | 'INVALID_ARGUMENTS'
  | 'TEMPORARILY_UNAVAILABLE'
  | 'TIME_SLOT_UNAVAILABLE'
  | 'CUSTOMER_NOT_FOUND';

/**
 * Error contract returned to the LLM. Only the codes above ever cross the
 * boundary: Prisma errors, stack traces, schema details and tenant ids are
 * never exposed. `TIME_SLOT_UNAVAILABLE` and `CUSTOMER_NOT_FOUND` are the two
 * business outcomes specific to the write tools (Phase 4A create_appointment).
 */
export class AIToolError extends Error {
  readonly code: AIToolErrorCode;

  constructor(code: AIToolErrorCode, message?: string) {
    super(message ?? code);
    this.name = 'AIToolError';
    this.code = code;
  }
}

export function toSafeErrorCode(error: unknown): AIToolErrorCode {
  return error instanceof AIToolError ? error.code : 'TEMPORARILY_UNAVAILABLE';
}
