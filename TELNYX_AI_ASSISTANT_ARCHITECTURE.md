# Telnyx AI Assistant Architecture — Buster Call Migration Audit

Status: AUDIT ONLY. No production assistant created, no phone number attached, no
live call placed. No legacy code deleted. This document is the Phase-1 deliverable
for migrating Buster Call's voice AI from the OpenAI-Realtime/LiveKit bridge to
**Telnyx AI Assistants (Voice AI Agents)**, keeping Buster Call as the
business/orchestration layer.

Repo: `antigravity-saas@0.1.0` — Next.js 16.2.9, React 19.2.4, Prisma.
Relevant packages installed: `telnyx@7.2.0`, `@telnyx/webrtc@2.27.1`, `ws@8.21.0`,
`openai@6.45.0`. No LiveKit client SDK installed.

---

## A. Executive Summary

Buster Call today runs **three unrelated "AI" stacks** that never actually drive a
live phone call:

1. **OpenAI Assistants API (text/chat)** — `app/api/ai-employees/route.ts:65`,
   `lib/ai/meta-agent.ts`, `lib/openai-skills.ts`. Creates `openai.beta.assistants`
   for WhatsApp / knowledge-base / skills. Used for chat, not voice.
2. **LiveKit SIP bridge (voice)** — `app/api/webhooks/telecom/route.ts:605-696`.
   On `call.answered`, if the dialed `PhoneNumber` has an active `AIEmployee`, the
   call is **transferred to `LIVEKIT_SIP_URI`** with base64 custom SIP headers
   (`X-Agent-Name`, `X-Agent-Voice`, `X-Organization-Id`, `X-Call-Log-Id`). A
   Python LiveKit agent (external, not in this repo) is expected to fetch the prompt
   from the DB and run STT/LLM/TTS.
3. **Legacy `server/media-server.ts`** (OpenAI Realtime WS) — per Mission 1 audit,
   `LEGACY`/`QUARANTINED`.

`LIVEKIT_SIP_URI` is **unset** in `.env.local`, so the voice-AI path currently fails
closed with `AI_MEDIA_NOT_CONFIGURED` (`route.ts:613-627`).

The Telnyx AI Assistant path removes the need for our own media/STT/TTS/LiveKit
bridge entirely: Telnyx owns STT, LLM, TTS, VAD, turn-taking and the runtime; we
attach an assistant to the live call with one Call Control command
(`ai_assistant_start`) and receive normal webhooks back.

**Recommended target:** Buster Call keeps its Call Control app as the inbound
orchestrator, resolves the tenant + `AIEmployee` from the dialed number, and starts a
Telnyx AI Assistant per call (passing dynamic variables). Assistant tools are
`webhook` tools pointing back at Buster Call internal APIs, guarded by tenant/owner
checks. This preserves multi-tenancy, billing and CRM logic while deleting our entire
media pipeline.

---

## B. Current State (evidence)

### B.1 Inbound voice → AI routing
`app/api/webhooks/telecom/route.ts` `call.answered` handler:

- Loads `callLog` with `phoneNumber.aiEmployee` (`:560-568`).
- Guard: Telnyx→LiveKit transfer child leg is never re-driven (`:580-586`).
- If `agent.isActive` (`:608`): requires `LIVEKIT_SIP_URI`, otherwise marks call
  `FAILED` + `AI_MEDIA_NOT_CONFIGURED` (`:612-627`).
- Builds `customHeaders` from the agent (`:631-638`) and calls
  `telnyx.calls.actions.transfer(callControlId, { to: livekitSipUri, ... })`
  (`:667-680`) with deterministic `command_id` + `client_state` for dedup.

Already-present Telnyx AI Assistant lifecycle webhooks (scaffolding, unused):
- `call.conversation_insights.generated` → writes `callLog.aiSummary` (`:1017-1027`).
- `call.conversation.ended` → logs only (`:1029-1033`).

### B.2 Text/chat AI
- `app/api/ai-employees/route.ts:65` creates `openai.beta.assistants.create`, stores
  `AIEmployee.openaiAssistantId` (`:87`), then `syncAgentSkillsWithOpenAI` (`:93`).
- `lib/openai-skills.ts` merges hardcoded tools + `AgentSkill` rows + knowledge base
  into the OpenAI assistant (`openai.beta.assistants.update`, `:229`).
- `app/api/webhooks/whatsapp/route.ts:288,392` uses `openaiAssistantId` for WhatsApp.
- Knowledge upload/scrape (`app/api/knowledge/{upload,scrape}/route.ts`) patch the
  OpenAI assistant / vector store.

### B.3 Existing Telnyx client
`lib/telnyx.ts` exposes `getConfiguredTelnyxClient()` (God-Mode key with env
fallback, `:52-59`), `getConfiguredTelnyxPublicKey()` for Ed25519 webhook
verification, and `getConfiguredTelnyxConnectionId()`. Reuse these for AI Assistants;
do not add a second client factory.

### B.4 Mission 1 verdicts (unchanged)
`TELNYX_WEBRTC_SDK=ACTIVE`, `TELNYX_MEDIA_STREAMING=ABSENT`,
`BIDIRECTIONAL_MEDIA=ABSENT`, `LIVEKIT_BRIDGE=PARTIAL`,
`OPENAI_REALTIME_BRIDGE=LEGACY`.

---

## C. Target Architecture

```
Caller ──PSTN──► Telnyx number ──► Buster Call Call-Control webhook
                                        │  (call.initiated / call.answered)
                                        ▼
                              resolve PhoneNumber → Organization → AIEmployee
                                        │
                                        ▼
                    POST /v2/calls/{call_control_id}/actions/ai_assistant_start
                                        { assistant: { id, dynamic_variables } }
                                        │
                                        ▼
                         Telnyx AI Assistant runtime
                    (STT ▸ LLM ▸ TTS ▸ VAD ▸ turn-taking ▸ tools)
                                        │  tool call (webhook)
                                        ▼
                     Buster Call internal tool endpoints (tenant-guarded)
                                        │
                                        ▼
                        CRM / Contacts / Calendar / Actions / Sms
```

Principles:
- **Telnyx = runtime** (media, STT/TTS, VAD, interruption, LLM). We delete our media
  path.
- **Buster Call = business layer** (tenancy, number→agent mapping, prompts, tools,
  CRM, billing, audit).
- Provider hidden from end users: UI says **"Buster Call AI Agent"**; only God Mode
  shows **"Telnyx AI Assistant"** / assistant IDs.
- Never call Telnyx from the browser. All assistant CRUD server-side.

---

## D. Telnyx AI Assistants API Surface

Base: `https://api.telnyx.com/v2`. SDK: `client.ai.assistants` (`telnyx@7.2.0`),
`node_modules/telnyx/resources/ai/assistants/assistants.d.ts`.

### D.1 Assistants resource
`client.ai.assistants`:
- `create(AssistantCreateParams)` → returns `{ id, name, model, instructions, ... }`
  (SDK return type is named `InferenceEmbedding`; `id` format
  `assistant-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`).
- `retrieve(id, { call_control_id?, fetch_dynamic_variables_from_webhook? })`
- `update(id, AssistantUpdateParams)`
- `list()`, `delete(id)`
- `chat(id, { content, conversation_id })` — text chat
- `sendSMS(id, ...)`, `clone(id)`, `getTexml(id)`, `imports(...)`
- Sub-resources: `.tools` (shared Tools Library: add/remove, `test`), `.versions`
  (get/update/promote/delete, canary deploys), `.tests` (create/run suites), `.tags`,
  `.instructions` (LLM enhance), `.scheduledEvents`, `.canaryDeploys`.

`AssistantCreateParams` (`:2438`) key fields:
`instructions` (required), `name` (required), `description`, `model`,
`greeting` (≤3000; empty = wait for caller;
`<assistant-speaks-first-with-model-generated-message>` = model-generated),
`voice_settings`, `transcription`, `telephony_settings`, `messaging_settings`,
`interruption_settings`, `tools` (inline, **deprecated for new integrations**),
`tool_ids` (shared tools — **preferred**), `mcp_servers`, `a2a_agents`,
`integrations`, `dynamic_variables`, `dynamic_variables_webhook_url`,
`dynamic_variables_webhook_timeout_ms` (1–10000), `enabled_features`,
`insight_settings`, `privacy_settings`, `post_conversation_settings`,
`observability_settings`, `conversation_flow`, `fallback_config`, `external_llm`,
`llm_api_key_ref`, `tags`, `widget_settings`.

Idempotency: pass an `Idempotency-Key` header (UUID v4). Replays only successful
responses up to 24h; body limit 256 KB when keyed.

### D.2 Voice / transcription / telephony
- `VoiceSettings.voice` (`:2135`): Telnyx voices as `Telnyx.<model>.<voice_id>`
  (e.g. `Telnyx.KokoroTTS.af_heart`, `Telnyx.Ultra.*`); ElevenLabs requires an
  integration secret `api_key_ref`. Voice id supports mustache dynamic variables.
- `telephony_settings`: `noise_suppression` (`aicoustics` | `krisp` |
  `deepfilter` | `disabled`), `recording_settings`, `time_limit_secs`,
  `user_idle_*`, `voicemail_detection`, `supports_unauthenticated_web_calls`,
  `send_message_history_updates`, `disable_dtmf`.
- `transcription`: `model` (e.g. `deepgram/flux`, `deepgram/nova-3` for multilingual),
  `language`, `settings` (EOT thresholds, endpointing).
- `interruption_settings`: barge-in enable, `disable_greeting_interruption`,
  `start_speaking_plan` (`wait_seconds`, `on_punctuation_seconds`,
  `on_no_punctuation_seconds`, `on_number_seconds`).
- Default model: `moonshotai/Kimi-K2.6` (native, no external key). Voice-verified
  OpenAI models need `llm_api_key_ref`.

### D.3 Tools (`AssistantTool`, `assistants.d.ts`)
Types: `function`, `webhook`, `client_side_tool`, `retrieval`, `handoff`, `hangup`,
`transfer`, `invite`, `sip_refer`, `dtmf`, `send_message`, `skip_turn`, `pay`,
`update_dynamic_variables`.

Most relevant for us:
- **`webhook`** (`WebhookTool`, `:2248`): `name`, `description`, `url`, `method`,
  `headers[]` (support integration-secret refs), `path/query/body_parameters`
  (JSON-schema), `store_fields_as_variables`, `async`, `async_timeout_ms`,
  `timeout_ms`. → our CRM/calendar/actions tools.
- **`transfer`** (`:2104`): `{ from, targets: [{ to, name }] | "{{ var }}" }` → warm/
  cold transfer to human/SIP.
- **`handoff`**: AI→AI transfer to another assistant.
- **`hangup`**, **`send_message`** (SMS/MMS), **`retrieval`** (knowledge base),
  **`dtmf`**, **`pay`**.

⚠ Constraint: each tool type except `function`, `webhook`, `client_side_tool` allows
**at most one instance** per assistant (inline + shared counted together). So one
`transfer`, one `hangup`, etc. Plan the tool set accordingly.

### D.4 Other resources
- `ai.conversations`: list/get/delete, create message, get messages (incl. tool calls),
  metadata, insights. → transcript storage / sync.
- `ai.integrations` + connections (Salesforce/HubSpot/etc.).
- `ai.mcp_servers`.
- `ai.missions` (research/outreach). Out of scope for Phase 1.

---

## E. Number/Assistant Binding & Call Activation

Two supported activation paths:

1. **Portal / number assignment** — assign a Telnyx number to an assistant so inbound
   calls hit the assistant directly. Simple, but **bypasses Buster Call's multi-tenant
   routing, billing and CRM** — not acceptable for the SaaS primary path.
2. **Call Control `ai_assistant_start` (recommended)** — keep the number pointed at
   our Call Control app; on `call.answered`, resolve the tenant and issue:
   ```
   POST /v2/calls/{call_control_id}/actions/ai_assistant_start
   { "assistant": { "id": "assistant-…", "dynamic_variables": { … } },
     "send_message_history_updates": true }
   ```
   Stop with `.../ai_assistant_stop`. Expected webhooks: `call.conversation.ended`,
   `call.conversation_insights.generated`.

**Recommendation:** path 2. It slots exactly where the current LiveKit transfer sits
(`route.ts:667`), requires no number re-assignment, and keeps God Mode/Telnyx as the
managed runtime while Buster Call stays the orchestrator.

Outbound: `POST /v2/texml/ai_calls/{texml_app_id}` with `{ From, To, AIAssistantId }`
(+ AMD params). Deferred to a later phase.

---

## F. Tools & Security Model

Rules (non-negotiable):
- **Never trust the model.** Tool inputs are untrusted. Every tool handler must
  re-derive `organizationId` from the *assistant identity*, never from LLM arguments.
- Bind each assistant to exactly one `organizationId` + `AIEmployee.id` at creation,
  via `dynamic_variables` (`org_id`, `employee_id`) injected by our backend at
  `ai_assistant_start`, and/or a per-call secret header.
- Every tool request must verify: assistant identity → org → `AIEmployee` exists and
  is active → resource ownership (`contactId`/`leadId` belongs to org) → permission of
  the acting agent/user.
- Tool webhook endpoint is a normal authenticated Buster Call route; require a header
  secret (integration secret ref in `WebhookTool.headers`) + Telnyx call/conversation
  correlation. Do not use a public unauthenticated endpoint.
- No PII/secrets in logs; redact phone numbers in assistant logs where possible.
- Read-only tools first (Phase 2), write tools gated behind explicit confirmation and
  audit logs (Phase 3).

Mapping `AgentSkill` → Telnyx tool:
- `AgentSkill.name` → tool name; `.description` → description; `.parametersSchema` →
  `body_parameters`/schema; `.endpointUrl` + `.method` → `url`/`method`; `.headers` →
  `headers[]`. `lib/openai-skills.ts` becomes the Telnyx tool-builder equivalent.

Planned Phase-2 registry (read-only): `findContact`, `searchCRM`,
`checkAvailability`, `getLead`, `lookupCustomer`.
Phase-3 (write, guarded): `createContact`, `createLead`, `updateLead`,
`createAppointment`, `sendSMS`, `sendWhatsApp`, `transferToHuman`.

---

## G. Multi-Tenancy & Data Model Mapping

Existing models (`prisma/schema.prisma`):
- `AIEmployee` (`:441`): `name`, `jobTitle`, `avatarUrl`, `systemPrompt`,
  `voiceId`, `language`, `handles*`, `openaiAssistantId`, `voicePhoneNumberId`
  (`@unique`), `knowledgeBaseId`, `organizationId`, `isActive`, `greeting`,
  `tacticalSilence`, `templateId`, `roleType`, `selectedTone`.
- `AgentTemplate` (`:494`), `AgentSkill` (`:1112`, `endpointUrl`/`method`/
  `parametersSchema`/`headers`), `KnowledgeBase`/`KnowledgeDocument`.
- `PhoneNumber` (`:174`): `number`, `telnyxId`, `organizationId`, `incomingRouting*`,
  `aiEmployee` back-relation. **No assistant-id column.**
- `CallLog` (`:271`): `telnyxCallControlId`, `aiSummary`, org refs.

Binding: `PhoneNumber` ↔ `AIEmployee` is already 1:1 via
`AIEmployee.voicePhoneNumberId @unique` → `PhoneNumber`. Inbound resolution
(`callLog.phoneNumber.aiEmployee`) already works.

Minimal schema changes (reuse over rewrite; no destructive migration):
- Add `AIEmployee.telnyxAssistantId String? @unique` (keep `openaiAssistantId` for
  legacy text/WhatsApp until migrated).
- Optionally add `AIEmployee.voiceProvider String @default("LEGACY")` to gate paths.
- Optionally `CallLog.telnyxConversationId String?` to persist assistant
  conversation id for transcript sync/insights.
- Reuse `tacticalSilence` → `interruption_settings.start_speaking_plan.wait_seconds`;
  `greeting` → `greeting`; `systemPrompt` → `instructions`; `voiceId`/`language` →
  `voice_settings.voice` / `transcription.language`.

No new tables required for Phase 1. `AgentSkill` already matches webhook-tool shape.

---

## H. Dynamic Variables & Personalization

Inject per-call context at `ai_assistant_start`:
`dynamic_variables: { org_id, employee_id, call_log_id, contact_id?, first_name?,
agent_target, end_user_target }` → templated in `instructions`/`greeting` with
`{{var}}`. Telnyx system vars: `{{telnyx_current_time}}`,
`{{telnyx_conversation_channel}}`, `{{telnyx_agent_target}}`,
`{{telnyx_end_user_target}}`, `{{call_control_id}}`.

Security gotcha: `dynamic_variables_webhook_url` responses **must** wrap under a
top-level `dynamic_variables` object, else values are ignored. The
`telnyx_conversation_id` is platform-set and safe from prompt injection (use it as
the correlation key for tool calls, not model-provided ids).

---

## I. Billing & Metering

- Telnyx Voice AI is billed per minute (~$0.05/min all-in per Telnyx getting-started
  docs; verify plan). **Must be metered separately from normal PSTN included
  minutes.**
- Track AI minutes distinctly: on `ai_assistant_start` tag the `CallLog` as AI; on
  `call.conversation.ended` compute duration and add to an AI-minutes counter
  (new field/table or existing usage ledger). Do not let AI calls consume the PSTN
  included-minute pool.
- Reuse the existing reservation/release pattern (`releasePstnReservation`,
  `clampForwardDuration`) but with a dedicated AI reason code.

---

## J. Migration Plan (phased, no big-bang)

Phase 0 (this doc): audit. ✅
Phase 1: `lib/telnyx-ai.ts` — server-only wrapper over `getConfiguredTelnyxClient`
  (`createAssistant`, `updateAssistant`, `getAssistant`, `deleteAssistant`,
  `startAssistantOnCall`, `stopAssistantOnCall`, `listAssistants`), tenant-scoped
  args, no live assistant creation yet.
Phase 2: schema additions (`telnyxAssistantId`, optional `voiceProvider`,
  `telnyxConversationId`); God Mode toggles Telnyx as AI provider per employee.
Phase 3: activate inbound path — feature-flag `AIEmployee.voiceProvider`, and where
  the current code transfers to LiveKit (`route.ts:667`), instead call
  `startAssistantOnCall`. Keep LiveKit branch behind the flag (no deletion).
Phase 4: tools registry (read-only → write), `AgentSkill` → webhook tools.
Phase 5: transcript sync + insights (`ai.conversations`, `call.conversation.ended`),
  separate AI billing meter.
Phase 6: remove legacy (`server/media-server.ts`, `@telnyx/video`, LiveKit branch)
  only after Telnyx path is verified in production.

Feature flag ensures both paths can coexist; default stays LEGACY/LiveKit until
explicitly enabled.

---

## K. Risks & Guardrails

- **Prompt injection via tools** → server-side authz only, never trust args.
- **Cross-tenant leakage** → assistant↔org binding enforced at creation and every
  tool call; org derived from assistant identity, not the model.
- **Single-instance tool limit** → one transfer/hangup/etc.; design accordingly.
- **Missing `tool_ids` vs inline** → prefer shared Tools Library (`tool_ids`); inline
  `tools` deprecated for new integrations.
- **LiveKit path still default** → do not enable the Telnyx branch until Phase 3 flag.
- **Billing bleed** → dedicated AI meter; never draw from PSTN pool.
- **No browser calls** → all Telnyx assistant operations server-side.
- **Ensure Telnyx webhooks verified** → reuse `getConfiguredTelnyxPublicKey()` Ed25519
  verification already used by the telecom webhook.
- **`.env` gaps**: `LIVEKIT_SIP_URI` absent (current AI voice path fails closed);
  no Telnyx AI-specific env needed beyond existing `TELNYX_API_KEY` /
  `TELNYX_PUBLIC_KEY`.

---

## L. Open Questions

1. Is Telnyx number→assistant assignment required on the account, or is
   `ai_assistant_start` sufficient without any number assignment? (Docs imply
   `ai_assistant_start` works on any active Call Control call.) — needs live confirm.
2. Confirm per-minute Voice AI price for our plan and whether native models
   (`moonshotai/Kimi-K2.6`) avoid extra LLM cost.
3. Which voice set: Telnyx native vs ElevenLabs (integration secret needed).
4. Do we sync transcripts to our DB (`ai.conversations`) or rely on Telnyx retention?
5. WhatsApp/chat (OpenAI Assistants today) migration timing — voice first, chat
   later, or unify on Telnyx messaging assistants?
6. Should `AIEmployee` be renamed or left as-is for product-facing "Buster Call AI
   Agent"?

---

## Verdicts

- `TELNYX_AI_ASSISTANT_API`: **AVAILABLE** — full CRUD + tools/versions/tests/chat/
  conversations via `telnyx@7.2.0` `client.ai.assistants`.
- `CALL_ACTIVATION`: **`ai_assistant_start`** on `call_control_id` (Call Control),
  not number re-assignment, to preserve multi-tenancy.
- `BUSTER_AI_PROVIDER_LAYER`: **REPLACE LiveKit transfer** at `route.ts:605-696` with
  `ai_assistant_start` behind a feature flag; Buster Call remains orchestrator.
- `AI_TENANT_MODEL`: **REUSE `AIEmployee`** + add `telnyxAssistantId`; binding already
  exists via `PhoneNumber`↔`AIEmployee`. No new tables required for Phase 1.
- `AI_TOOL_SECURITY`: **SERVER-SIDE AUTHZ REQUIRED** — derive org from assistant
  identity, never from model args; read-only tools first.
- `LEGACY_AI_BRIDGE`: **QUARANTINED** — `server/media-server.ts` +
  `@telnyx/video` + LiveKit branch retained, not deleted, until Phase 6.
- `CUSTOM_MEDIA_GATEWAY`: **DEFERRED** — Telnyx owns media; no custom Media Streaming.
- `AI_BILLING`: **SEPARATE METER** — AI minutes must not consume PSTN included pool.
