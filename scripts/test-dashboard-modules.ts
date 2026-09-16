import assert from 'node:assert/strict';
import { dashboardModuleHref, resolveDashboardModule } from '../lib/dashboard-modules';

assert.equal(resolveDashboardModule('/dashboard/tickets'), 'ai');
assert.equal(resolveDashboardModule('/dashboard/automations'), 'ai');
assert.equal(resolveDashboardModule('/dashboard/rag-memory/documents'), 'ai');
assert.equal(resolveDashboardModule('/dashboard/sms-inbox'), 'messages');
assert.equal(resolveDashboardModule('/dashboard/inbox'), 'messages');
assert.equal(resolveDashboardModule('/dashboard/whatsapp/templates'), 'social');
assert.equal(resolveDashboardModule('/dashboard/campaigns/123'), 'voice');
assert.equal(resolveDashboardModule('/dashboard/softphone'), 'voice');

// Shared pages retain the module chosen in the navigation.
assert.equal(resolveDashboardModule('/dashboard/numbers', 'voice'), 'voice');
assert.equal(resolveDashboardModule('/dashboard/settings', 'messages'), 'messages');
assert.equal(resolveDashboardModule('/dashboard/numbers', 'invalid'), 'voice');
assert.equal(resolveDashboardModule('/dashboard/numbers', 'phone'), 'voice');
assert.equal(resolveDashboardModule('/dashboard/tickets', 'voice'), 'ai');
assert.equal(dashboardModuleHref('/dashboard/settings', 'ai'), '/dashboard/settings?module=ai');

console.log('Dashboard module routing tests passed');
