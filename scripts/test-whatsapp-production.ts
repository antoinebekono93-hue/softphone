import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

const sender = source('lib/whatsapp.ts');
const webhook = source('app/api/webhooks/whatsapp/route.ts');
const godMode = source('app/god-mode/whatsapp/actions.ts');
const templateCollection = source('app/api/whatsapp/templates/route.ts');
const templateResource = source('app/api/whatsapp/templates/[id]/route.ts');
const legacyLink = source('app/api/whatsapp/link-account/route.ts');
const legacyProvider = source('app/api/whatsapp/tech-provider/route.ts');
const schema = source('prisma/schema.prisma');

assert.match(sender, /messages\.sendWhatsapp\(/, 'WhatsApp must use the Telnyx SDK sender.');
assert.match(sender, /reserveWhatsAppCharge\(/, 'Billing must be reserved before sending.');
assert.match(sender, /confirmWhatsAppCharge\(/, 'A confirmed Telnyx ID must confirm billing.');
assert.match(sender, /refundWhatsAppCharge\(/, 'Certain provider rejections must be refunded.');
assert.doesNotMatch(sender, /mock_token|MOCK_WABA|Date\.now\(\).*wa_/i, 'Fake provider identifiers are forbidden.');

assert.match(webhook, /constructEvent\(rawBody, signature, timestamp, publicKey\)/, 'Webhook signatures must be verified.');
assert.match(webhook, /message\.received/, 'Inbound messages must be handled.');
assert.match(webhook, /message\.sent/, 'Telnyx sent events must be handled.');
assert.match(webhook, /message\.finalized/, 'Telnyx finalized events must be handled.');
assert.match(webhook, /getConfiguredTelnyxApiKey\(\)/, 'Protected media must use the God Mode Telnyx key.');
assert.doesNotMatch(webhook, /Bearer \$\{process\.env\.TELNYX_API_KEY\}/, 'WhatsApp must not bypass God Mode credentials.');

assert.match(godMode, /initializeWhatsAppVerification/, 'God Mode must expose number verification.');
assert.match(godMode, /profile\.photo\.upload/, 'God Mode must expose profile photo upload.');
assert.match(godMode, /callingSettings\.update/, 'God Mode must expose WhatsApp calling settings.');
assert.match(godMode, /businessAccounts\.settings\.update/, 'God Mode must expose WABA webhook settings.');

assert.match(templateCollection, /whatsapp\.templates\.create/, 'Templates must be created with the Telnyx SDK.');
assert.match(templateResource, /whatsappMessageTemplates\.retrieve/, 'Templates must be retrievable from Telnyx.');
assert.match(templateResource, /whatsappMessageTemplates\.update/, 'Templates must be editable through Telnyx.');
assert.match(templateResource, /whatsappMessageTemplates\.delete/, 'Templates must be deleted through Telnyx.');

assert.match(legacyLink, /status:\s*410/, 'The legacy fake account-link flow must stay disabled.');
assert.match(legacyProvider, /status:\s*410|status:\s*403/, 'The legacy provider flow must stay disabled.');
assert.match(schema, /model WhatsAppAccount[\s\S]*telnyxId\s+String\?\s+@unique/, 'The Telnyx WABA mapping must be durable.');
assert.match(schema, /model WhatsAppTemplate[\s\S]*telnyxId\s+String\?\s+@unique/, 'The Telnyx template mapping must be durable.');

console.log('WhatsApp production invariants: OK');
