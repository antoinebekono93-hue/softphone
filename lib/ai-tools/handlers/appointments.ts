import {
  buildAppointmentIdempotencyKey,
  type CreateAppointmentOutcome,
} from '../appointments';
import {
  evaluateBusinessHours,
  findNextAvailableWindows,
  resolveBusinessHours,
  type ResolvedBusinessHours,
} from '../business-hours';
import { toAppointmentDTO, type AppointmentDTO } from '../dto';
import { AIToolError } from '../errors';
import { isValidIanaTimeZone, zonedLocalToUtc } from '../time';
import type { AIToolDefinition } from '../tool-definition';
import type { AIToolEventName, AIToolEventSink } from '../observability';
import type { AIToolExecutionContext } from '../types';
import {
  readOptionalString,
  readPhone,
  readRequiredString,
  rejectUnknownKeys,
} from '../validation';

const MIN_DURATION_MINUTES = 5;
const MAX_DURATION_MINUTES = 480;
const DEFAULT_DURATION_MINUTES = 30;
const NEXT_AVAILABLE_HORIZON_DAYS = 7;
const NEXT_AVAILABLE_MAX_RESULTS = 3;

const ALLOWED_KEYS = [
  'date',
  'time',
  'timezone',
  'duration_minutes',
  'customer_name',
  'reason',
  'phone',
  'contact_id',
] as const;

function emit(
  events: AIToolEventSink,
  name: AIToolEventName,
  context: AIToolExecutionContext,
  extra: Partial<{
    errorCode: AIToolError['code'];
    reason: string;
  }> = {}
): void {
  events.emit({
    name,
    toolName: context.toolName,
    assistantId: context.assistantId,
    employeeId: context.employeeId,
    organizationId: context.organizationId,
    conversationId: context.telnyxConversationId ?? undefined,
    requestId: context.requestId,
    ...extra,
  });
}

function readDuration(args: Record<string, unknown>): number {
  const value = args.duration_minutes;
  if (value === undefined || value === null || value === '') {
    return DEFAULT_DURATION_MINUTES;
  }
  const parsed = typeof value === 'string' ? Number(value) : value;
  if (
    typeof parsed !== 'number' ||
    !Number.isInteger(parsed) ||
    parsed < MIN_DURATION_MINUTES ||
    parsed > MAX_DURATION_MINUTES
  ) {
    throw new AIToolError('INVALID_ARGUMENTS', 'Invalid argument: duration_minutes');
  }
  return parsed;
}

/**
 * Phase 4A : unique outil d'écriture. Ne persiste jamais sans autorisation
 * explicite (`appointments:write` + allowlist), sans fuseau IANA résolu, ni
 * sans vérification de conflit locale. Aucune intégration calendrier externe.
 */
export const createAppointmentTool: AIToolDefinition<AppointmentDTO> = {
  name: 'create_appointment',
  description:
    "Create an appointment for the caller once the caller has explicitly confirmed the date, time and timezone. Never book before the caller confirms. Returns the confirmed appointment.",
  inputSchema: {
    type: 'object',
    properties: {
      date: {
        type: 'string',
        description: 'Appointment date in YYYY-MM-DD format (caller local date).',
      },
      time: {
        type: 'string',
        description: 'Appointment start time in 24h HH:MM format (caller local time).',
      },
      timezone: {
        type: 'string',
        description:
          'IANA timezone (e.g. Europe/Paris). Optional: falls back to the organization timezone.',
      },
      duration_minutes: {
        type: 'integer',
        minimum: MIN_DURATION_MINUTES,
        maximum: MAX_DURATION_MINUTES,
      },
      customer_name: {
        type: 'string',
        description: 'Name to display on the appointment.',
      },
      reason: {
        type: 'string',
        description: 'Short reason for the appointment.',
      },
      phone: {
        type: 'string',
        description: 'Optional caller phone; used only to link an existing contact.',
      },
      contact_id: {
        type: 'string',
        description: 'Optional existing contact id, scoped to the organization.',
      },
    },
    required: ['date', 'time'],
    additionalProperties: false,
  },
  riskLevel: 'WRITE',
  requiredPermissions: ['appointments:write'],
  enabled: true,
  async handler(args, context, deps) {
    emit(deps.events, 'AI_APPOINTMENT_REQUESTED', context);

    if (!deps.appointments) {
      emit(deps.events, 'AI_APPOINTMENT_FAILED', context, {
        errorCode: 'TEMPORARILY_UNAVAILABLE',
      });
      throw new AIToolError('TEMPORARILY_UNAVAILABLE');
    }

    rejectUnknownKeys(args, ALLOWED_KEYS);
    const date = readRequiredString(args, 'date', 10);
    const time = readRequiredString(args, 'time', 5);
    const durationMinutes = readDuration(args);
    const timezoneArg = readOptionalString(args, 'timezone', 64);
    let customerName = readOptionalString(args, 'customer_name', 120) ?? null;
    const reason = readOptionalString(args, 'reason', 500) ?? null;
    const contactIdArg = readOptionalString(args, 'contact_id', 120);
    const phoneArg = readOptionalString(args, 'phone', 32);

    const resolvedTimezone =
      timezoneArg ??
      (await deps.appointments.getOrganizationTimezone(context.organizationId));
    if (!resolvedTimezone || !isValidIanaTimeZone(resolvedTimezone)) {
      emit(deps.events, 'AI_APPOINTMENT_FAILED', context, {
        errorCode: 'INVALID_ARGUMENTS',
      });
      throw new AIToolError('INVALID_ARGUMENTS', 'Invalid argument: timezone');
    }

    const startsAt = zonedLocalToUtc(date, time, resolvedTimezone);
    if (!startsAt) {
      emit(deps.events, 'AI_APPOINTMENT_FAILED', context, {
        errorCode: 'INVALID_ARGUMENTS',
      });
      throw new AIToolError('INVALID_ARGUMENTS', 'Invalid argument: date/time');
    }
    const endsAt = new Date(startsAt.getTime() + durationMinutes * 60_000);

    if (startsAt.getTime() <= deps.now()) {
      emit(deps.events, 'AI_APPOINTMENT_FAILED', context, {
        errorCode: 'INVALID_ARGUMENTS',
      });
      throw new AIToolError('INVALID_ARGUMENTS', 'Invalid argument: date');
    }

    // Phase 4A.2 : les horaires d'ouverture sont évalués AVANT toute écriture,
    // et hors transaction (une modification de planning n'est pas un risque de
    // double-réservation). Aucune configuration => comportement non restreint
    // (décision A), le legacy reste inchangé.
    let businessHours: ResolvedBusinessHours;
    try {
      businessHours = resolveBusinessHours(
        await deps.appointments.getBusinessHours({
          organizationId: context.organizationId,
          aiEmployeeId: context.employeeId,
        })
      );
    } catch {
      emit(deps.events, 'AI_APPOINTMENT_FAILED', context, {
        errorCode: 'TEMPORARILY_UNAVAILABLE',
      });
      throw new AIToolError('TEMPORARILY_UNAVAILABLE');
    }

    if (!businessHours.configured) {
      emit(deps.events, 'AI_APPOINTMENT_BUSINESS_HOURS_CHECK', context, {
        reason: 'UNRESTRICTED',
      });
    } else {
      const evaluation = evaluateBusinessHours({
        startsAt,
        endsAt,
        timezone: resolvedTimezone,
        windows: businessHours.windows,
      });
      emit(deps.events, 'AI_APPOINTMENT_BUSINESS_HOURS_CHECK', context, {
        reason: evaluation.withinHours
          ? `WITHIN_HOURS:${businessHours.source}`
          : evaluation.reason,
      });
      if (!evaluation.withinHours) {
        const nextAvailableWindows = findNextAvailableWindows({
          after: new Date(deps.now()),
          durationMs: endsAt.getTime() - startsAt.getTime(),
          timezone: resolvedTimezone,
          windows: businessHours.windows,
          maxDays: NEXT_AVAILABLE_HORIZON_DAYS,
          maxResults: NEXT_AVAILABLE_MAX_RESULTS,
        });
        emit(deps.events, 'AI_APPOINTMENT_OUTSIDE_HOURS', context, {
          errorCode: 'TIME_OUTSIDE_BUSINESS_HOURS',
          reason: evaluation.reason,
        });
        throw new AIToolError(
          'TIME_OUTSIDE_BUSINESS_HOURS',
          'Requested time is outside business hours',
          {
            timezone: resolvedTimezone,
            requestedStart: startsAt.toISOString(),
            requestedEnd: endsAt.toISOString(),
            ...(nextAvailableWindows.length > 0
              ? { nextAvailableWindows }
              : {}),
          }
        );
      }
    }

    let contactId: string | null = null;
    let canonicalPhone: string | null = null;
    if (contactIdArg) {
      const contact = await deps.db.getContact(
        context.organizationId,
        contactIdArg
      );
      if (!contact) {
        emit(deps.events, 'AI_APPOINTMENT_FAILED', context, {
          errorCode: 'CUSTOMER_NOT_FOUND',
        });
        throw new AIToolError('CUSTOMER_NOT_FOUND');
      }
      contactId = contact.id;
      if (!customerName && contact.name) customerName = contact.name;
    } else if (phoneArg) {
      const phone = readPhone(args, 'phone');
      canonicalPhone = phone.canonical;
      const contact = await deps.db.findContactByPhone(
        context.organizationId,
        phone.candidates
      );
      if (contact) {
        contactId = contact.id;
        if (!customerName && contact.name) customerName = contact.name;
      }
    }

    emit(deps.events, 'AI_APPOINTMENT_AUTHORIZED', context);

    const idempotencyKey = buildAppointmentIdempotencyKey({
      organizationId: context.organizationId,
      aiEmployeeId: context.employeeId,
      requestId: context.toolCallRequestId ?? null,
      startsAt,
      endsAt,
      contactId,
      customerName,
      customerPhone: canonicalPhone,
    });

    let outcome: CreateAppointmentOutcome;
    try {
      outcome = await deps.appointments.createAppointment({
        organizationId: context.organizationId,
        aiEmployeeId: context.employeeId,
        contactId,
        customerName,
        customerPhone: canonicalPhone,
        reason,
        startsAt,
        endsAt,
        timezone: resolvedTimezone,
        status: 'CONFIRMED',
        idempotencyKey,
        sourceRequestId: context.toolCallRequestId ?? context.requestId,
      });
    } catch (error) {
      emit(deps.events, 'AI_APPOINTMENT_FAILED', context, {
        errorCode: error instanceof AIToolError ? error.code : 'TEMPORARILY_UNAVAILABLE',
      });
      throw new AIToolError('TEMPORARILY_UNAVAILABLE');
    }

    // Anti-double-réservation : la détection de chevauchement et l'écriture
    // sont atomiques côté writer. Un perdant reçoit un conflit contrôlé.
    if (outcome.status === 'CONFLICT') {
      emit(deps.events, 'AI_APPOINTMENT_CONFLICT', context, {
        errorCode: 'TIME_SLOT_UNAVAILABLE',
        reason: 'SLOT_OVERLAP',
      });
      throw new AIToolError('TIME_SLOT_UNAVAILABLE');
    }
    if (outcome.status === 'UNAVAILABLE') {
      emit(deps.events, 'AI_APPOINTMENT_FAILED', context, {
        errorCode: 'TEMPORARILY_UNAVAILABLE',
        reason: 'WRITE_CONTENTION',
      });
      throw new AIToolError('TEMPORARILY_UNAVAILABLE');
    }

    emit(deps.events, 'AI_APPOINTMENT_CREATED', context, {
      reason: outcome.status,
    });
    return toAppointmentDTO(outcome.appointment);
  },
};
