# Telnyx AI Tools Security Report — Buster Call Phase 2

Status: IMPLEMENTATION + AUDIT. No production assistant created, no phone number
attached, no live call placed, no write-capable tool enabled, no database
migration applied. The Phase-1 migration
(`prisma/migrations/20261013000000_add_telnyx_ai_assistant`) was **not** applied.
No commit / push performed.

Scope: the server-side **tool registry and security guards** that a Telnyx AI
Assistant will invoke (over webhook tools) during a voice conversation. Only
read-only tools are enabled in this phase.

Verification (all green):

- `npx prisma validate` → valid
- `npx tsc --noEmit` → clean
- `npx eslint lib/ai-tools scripts/test-ai-tools.ts` → clean
- `npx tsx scripts/test-ai-tools.ts` → `AI TOOLS : COUVERTURE COMPLÈTE`

Delivered files:

- `lib/ai-tools/registry.ts` — central tool registry + risk gate
- `lib/ai-tools/context.ts` — `resolveAuthorizedAssistant` identity guard
- `lib/ai-tools/allowlist.ts` — per-employee permission allowance
- `lib/ai-tools/validation.ts` — strict, hand-written argument validation (no zod)
- `lib/ai-tools/dto.ts` — explicit output DTOs
- `lib/ai-tools/data-access.ts` + `data-access-prisma.ts` — tenant-scoped reads
- `lib/ai-tools/execute.ts` — `executeAIToolCall` orchestration
- `lib/ai-tools/rate-limit.ts`, `replay.ts`, `observability.ts`
- `lib/ai-tools/telnyx-definitions.ts` — pure `buildTelnyxToolDefinitionsForEmployee`
- `lib/ai-tools/future-tools.ts` — disabled write/communication/transfer interfaces
- `lib/ai-tools/index.ts`, `deps.ts`, `errors.ts`, `types.ts`, `tool-definition.ts`
- `lib/ai-tools/handlers/contacts.ts`, `handlers/opportunities.ts`
- `scripts/test-ai-tools.ts` — A–P coverage, DB-free (injected fakes)

---

## A. Scope and non-goals

In scope: identity guard, tenant isolation, allowlist, read-only enforcement,
strict validation, DTO-only output, error contract, replay protection, rate
limiting, observability, the pure Telnyx tool-definition builder.

Out of scope (deliberately not done): any live assistant/number binding, any
write tool, any webhook route that actually receives Telnyx tool calls, any
migration/schema change, deleting the legacy OpenAI-Realtime/LiveKit bridge.

## B. Threat model — Telnyx is never authoritative

A tool call may originate from a compromised/spoofed sender, a replayed event,
or an LLM that was prompt-injected via CRM data. Therefore:

- The **only** trusted identity input is the Telnyx assistant id, which is
  resolved to a real `AIEmployee` row. Tenant, provider and active status come
  from that row — never from the request body.
- `organizationId`, `userId`, `contactId`, `leadId` supplied in tool arguments
  are **never** used as authority. Any such unexpected key is rejected
  (`INVALID_ARGUMENTS`). See test N1.
- All resource reads are scoped by the resolved `organizationId`. A record id
  alone is never sufficient. See tests F1, P1.

## C. Identity and authorization guard — `resolveAuthorizedAssistant`

Order: known assistant → provider `TELNYX` → active → optional tenant hint match
→ non-empty granted permissions. On any failure it throws an `AIToolError` and
returns **nothing** (no partial identity leaks to the model).

- Unknown assistant → `NOT_FOUND` (test A1).
- Provider not `TELNYX` → `NOT_ALLOWED`.
- Inactive employee → `NOT_ALLOWED` (test C1).
- `expectedOrganizationId` mismatch → `NOT_ALLOWED` (test B1).

The guard is the single chokepoint; `executeAIToolCall` cannot proceed without a
`ResolvedAssistant`.

## D. Tenant isolation

`prismaAIToolDataAccess` selects only the needed columns and always includes
`organizationId` in the `where` clause:

- `getContact(organizationId, id)` — `findFirst({ where: { id, organizationId } })`
- `getOpportunity(organizationId, id)` — same pattern
- `searchContacts` / `searchOpportunities` — filter by `organizationId`
- `findContactByPhone` — filter by `organizationId` + phone candidates

No `findUnique({ id })` on a tenant-owned model. Test F1 proves a cross-tenant id
yields `NOT_FOUND`.

## E. Tool registry and allowlist

`lib/ai-tools/registry.ts` is the only source of runnable tools. Each definition
declares `name`, `description`, `inputSchema` (JSON Schema), `riskLevel`,
`requiredPermissions`, `enabled` and a `handler`.

Allowlist: `grantedPermissionsFor` grants `contacts:read` + `crm:read` only to
**active TELNYX** employees. A tool is runnable only if it is registered,
enabled, risk-allowed, and its `requiredPermissions` are granted. Phase 2 has no
per-employee tool configuration in the schema; adding one would require a schema
change, which this phase is forbidden from making.

Registered (read-only) tools: `get_customer_by_phone`, `search_contacts`,
`get_contact`, `search_crm`, `get_opportunity`.

## F. Risk levels and read-only enforcement

Risk levels: `READ_ONLY | WRITE | COMMUNICATION | FINANCIAL | TRANSFER`.
`AI_TOOL_ENABLED_RISK_LEVELS = ['READ_ONLY']`. `executeAIToolCall` rejects any
definition whose risk level is not `READ_ONLY` (defence in depth on top of the
allowlist). `scripts/test-ai-tools.ts` J1/J2/J3 statically confirm no Prisma write
call exists in `lib/ai-tools` and that the data-access interface only reads; J3
asserts every enabled tool is `READ_ONLY`.

Read-only means read-only: no `create`, `update`, `delete`, `upsert`, `send`,
`transfer` or charge anywhere in the registry or data access.

## G. Input validation

Hand-written strict validators (the repo has no `zod`, so none was added):

- `asArgumentsObject` accepts an object or a JSON string, rejects arrays/primitives.
- `rejectUnknownKeys` rejects any key not declared by the tool's `inputSchema`.
- Bounded strings (`search query` 2–80, ids/fields ≤ 120), enum reads, integer
  `limit` clamped to 1–10 (default 5), and phone normalization via
  `phoneNumberLookupCandidates` / `canonicalizePhoneNumber`.

Tests G1, G2, H1, H2, N1 cover missing/short/oversized/unknown arguments.

## H. Output — DTOs only

Handlers return explicit DTOs (`ContactDTO`, `OpportunityDTO`) or envelopes
(`{ count, contacts }`). Phone, notes, spend history, lifetime value, relations
and tenant plumbing never leave the handler. Test I1 asserts sensitive keys are
absent from the returned data.

## I. Error contract

Exactly four codes reach the model: `NOT_FOUND`, `NOT_ALLOWED`,
`INVALID_ARGUMENTS`, `TEMPORARILY_UNAVAILABLE`. `toSafeErrorCode` maps any
unexpected exception to `TEMPORARILY_UNAVAILABLE`. Prisma errors, stack traces,
schema details and tenant ids are never surfaced.

## J. Tool authentication (how Telnyx reaches the tools)

Telnyx AI Assistants call tools as **webhook tools**: the platform POSTs the
model-chosen `body_parameters` to a configured URL. `buildTelnyxToolDefinitionsForEmployee`
emits, per allowed tool, a webhook definition pointing at
`{baseUrl}/api/ai/tools/{tool_name}` with the tool's JSON Schema as
`body_parameters`.

Identity is **not** carried in the webhook body. The receiving route (Phase 3,
not built here) must derive the assistant identity from the call context
(`telnyxConversationId` / call control correlation) and **verify the Telnyx
webhook signature** before calling `executeAIToolCall`. The `expectedOrganizationId`
hint exists for that route to assert cross-tenant consistency. This is the one
open integration item carried into Phase 3.

Note: the SDK's `AssistantTool` union has no OpenAI-style `function` tool; the
supported inline tool type is `InferenceEmbeddingWebhookToolParams`
(`type: 'webhook'`), which the pure builder targets structurally.

## K. Replay protection

`AIToolReplayStore` (in-memory, TTL 10 min, bounded to 5000 entries) caches the
result of a successful call under a caller-supplied `idempotencyKey` (the Telnyx
tool-call / event id). A duplicate delivery returns the first result and does not
re-run the handler, nor consume rate-limit budget. Test L1/L2 confirm one handler
execution and identical results.

## L. Rate limiting

`createAIToolRateLimiter` is a deterministic sliding-window limiter scoped per
**assistant**, **organization** and (when present) **conversation** (defaults
120 / 300 / 60 per 60 s). It peeks all scopes first and only consumes when the
whole call is allowed, so a denied call never partially drains another scope.
Exceeding any scope → `TEMPORARILY_UNAVAILABLE`. Test K1/K2 confirm enforcement.

## M. Observability — no PII

Events: `AI_TOOL_REQUESTED`, `AI_TOOL_AUTHORIZED`, `AI_TOOL_DENIED`,
`AI_TOOL_SUCCEEDED`, `AI_TOOL_FAILED`. Payload carries `toolName`, internal
`assistantId`, `employeeId`, `organizationId`, `conversationId`, `requestId`,
`durationMs`, `errorCode` only. No contact records, message content, prompts, PII
or audio. Test M1–M4 assert the serialized event stream contains no contact name,
email or phone, while retaining internal ids.

## N. Prompt-injection boundary

CRM/contact data returned by tools is **untrusted DATA**, never instructions. The
DTOs expose no free-form control fields; unknown/injected argument keys are
rejected. Assistant instructions (Phase 3) must state that tool output is
informational and must not be interpreted as commands. Because no write tool is
enabled, a successful injection cannot mutate data or send communications in this
phase.

## O. Future tools (declared, disabled, never registered)

`lib/ai-tools/future-tools.ts` declares — with `enabled: false` and no handler —
`create_contact`, `update_contact`, `create_lead`, `create_appointment`,
`get_business_hours`, `get_agent_availability`, `send_sms`, `send_whatsapp`,
`transfer_to_human`. Test D2/D3/J5 confirm none are registered or allowlisted.

Two of these cannot be implemented today because the models do not exist:
`get_business_hours` and `get_agent_availability` (no BusinessHours / availability
model), and `create_lead` (no `Lead` model). `search_crm` is scoped to the real
`Opportunity` model. `get_lead` is intentionally not provided.

## Verdicts

- **AI_TOOLS_REGISTRY = READY**. Single central registry, JSON Schemas, risk
  levels, permissions, enabled flags. Five read-only tools registered.
- **AI_ASSISTANT_IDENTITY_GUARD = READY**. Server-side resolution only; Telnyx
  never authoritative; unknown / inactive / foreign-tenant / mismatched assistant
  all denied with no data returned.
- **AI_TENANT_ISOLATION = READY**. Every read is `organizationId`-scoped; no bare
  id lookups; DTOs carry no tenant plumbing.
- **READ_ONLY_TOOLS = ENFORCED**. Only `READ_ONLY` definitions enabled and
  runnable; static tests prove no write path exists in `lib/ai-tools`.
- **AI_TOOL_AUTHENTICATION = PARTIAL (by design)**. Pure definition builder done;
  the receiving webhook route + Telnyx signature verification are Phase 3 and
  flagged as the single open integration item.
- **AI_TOOL_REPLAY_PROTECTION = READY**. Idempotency cache keyed by the tool-call
  id; duplicates return the first result without re-execution.
- **AI_TOOL_STATIC_READINESS = READY**. `prisma validate`, `tsc --noEmit`, `eslint`
  and the DB-free test suite (A–P) all pass.

## Open items carried to Phase 3 (not done here)

1. Build the `/api/ai/tools/[tool]` webhook route, verify the Telnyx webhook
   signature, derive the assistant id from call correlation, then call
   `executeAIToolCall`.
2. Add integration-level (real-DB) tests for the `prismaAIToolDataAccess` queries.
3. Model additions (`Lead`, business hours, availability) before enabling the
   corresponding read tools.
4. Any write/communication/transfer tool requires a new, separately reviewed
   phase.

STOP.
