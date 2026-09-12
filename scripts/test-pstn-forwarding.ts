import assert from "node:assert/strict";
import {
  canManageIncomingRouting,
  clampForwardDuration,
  evaluateForwardDestination,
  forwardingPlanAvailability,
  forwardingPlanDenialPayload,
  incomingRouteInstruction,
  normalizeIncomingRouting,
  shouldClaimForward,
  wouldCreateForwardLoop,
} from "../lib/pstn-forwarding-policy";

const now = new Date("2026-09-09T12:00:15Z");
assert.deepEqual(incomingRouteInstruction("APP"), { notifyApp: true, scheduleForward: false, forwardImmediately: false });
assert.deepEqual(incomingRouteInstruction("FORWARD"), { notifyApp: false, scheduleForward: false, forwardImmediately: true });
assert.deepEqual(incomingRouteInstruction("APP_THEN_FORWARD"), { notifyApp: true, scheduleForward: true, forwardImmediately: false });
assert.equal(shouldClaimForward({ callStatus: "RINGING", forwardStatus: "SCHEDULED", dueAt: new Date(now.getTime() + 1), now }), false);
assert.equal(shouldClaimForward({ callStatus: "RINGING", forwardStatus: "SCHEDULED", dueAt: now, now }), true);
assert.equal(shouldClaimForward({ callStatus: "IN_PROGRESS", forwardStatus: "SCHEDULED", dueAt: now, now }), false);
assert.equal(shouldClaimForward({ callStatus: "NO_ANSWER", forwardStatus: "SCHEDULED", dueAt: now, now }), false);
assert.equal(shouldClaimForward({ callStatus: "ENDING", forwardStatus: "SCHEDULED", dueAt: now, now }), false);
assert.equal(shouldClaimForward({ callStatus: "RINGING", forwardStatus: "STARTING", dueAt: now, now }), false);

const normalized = normalizeIncomingRouting({ mode: "APP_THEN_FORWARD", forwardToE164: "00237699112233", ringAppSeconds: 15 });
assert.equal(normalized.forwardToE164, "+237699112233");
assert.throws(() => normalizeIncomingRouting({ mode: "FORWARD", forwardToE164: "abc", ringAppSeconds: 15 }), /INVALID_FORWARD_DESTINATION/);
assert.throws(() => normalizeIncomingRouting({ mode: "APP_THEN_FORWARD", forwardToE164: "+237699112233", ringAppSeconds: 2 }), /INVALID_RING_SECONDS/);

assert.equal(evaluateForwardDestination({ destination: "+237699112233", sourceCountry: "US", internationalEnabled: false }).reason, "INTERNATIONAL_DISABLED");
assert.equal(evaluateForwardDestination({ destination: "+237699112233", sourceCountry: "US", internationalEnabled: true, blockedDestinations: "CM" }).reason, "DESTINATION_BLOCKED");
assert.equal(evaluateForwardDestination({ destination: "+237699112233", sourceCountry: "US", internationalEnabled: true, allowedDestinations: "US,FR" }).reason, "DESTINATION_NOT_ALLOWED");
assert.equal(evaluateForwardDestination({ destination: "+237699112233", sourceCountry: "US", internationalEnabled: true, allowedDestinations: "CM" }).authorized, true);

const routes = [
  { number: "+12025550100", forwardToE164: "+237699112233", incomingRoutingEnabled: true, incomingRoutingMode: "FORWARD" },
  { number: "+12025550101", forwardToE164: "+12025550100", incomingRoutingEnabled: true, incomingRoutingMode: "FORWARD" },
];
assert.equal(wouldCreateForwardLoop("+12025550100", "+12025550100", routes), true);
assert.equal(wouldCreateForwardLoop("+12025550100", "+12025550101", routes), true);
assert.equal(wouldCreateForwardLoop("+12025550100", "+237699112233", routes), false);

assert.equal(canManageIncomingRouting({ userId: "a", userOrganizationId: "org-a", numberOrganizationId: "org-b", assignedUserId: "a" }), false);
assert.equal(canManageIncomingRouting({ userId: "a", userOrganizationId: "org-a", numberOrganizationId: "org-a", assignedUserId: "a" }), true);
assert.equal(canManageIncomingRouting({ userId: "admin", userOrganizationId: "org-a", numberOrganizationId: "org-a", assignedUserId: "a", role: "ADMIN" }), true);
assert.equal(canManageIncomingRouting({ userId: "root", userOrganizationId: "org-a", numberOrganizationId: "org-b", isSuperAdmin: true }), true);
assert.equal(clampForwardDuration(10), 60);
assert.equal(clampForwardDuration(3600), 3600);
assert.equal(clampForwardDuration(99999), 14400);

assert.deepEqual(forwardingPlanAvailability(null), {
  allowed: false,
  missingCapabilities: ["hasCallRouting", "hasTransfer"],
});
assert.deepEqual(forwardingPlanAvailability({ hasCallRouting: true, hasTransfer: false }), {
  allowed: false,
  missingCapabilities: ["hasTransfer"],
});
assert.deepEqual(forwardingPlanAvailability({ hasCallRouting: true, hasTransfer: true }), {
  allowed: true,
  missingCapabilities: [],
});
assert.deepEqual(
  forwardingPlanDenialPayload({ id: "starter", name: "Starter", hasCallRouting: false, hasTransfer: true }),
  {
    error: "Le forfait actuel n’inclut pas toutes les fonctions nécessaires au transfert d’appels.",
    code: "FORWARDING_NOT_INCLUDED",
    plan: { id: "starter", name: "Starter" },
    missingCapabilities: ["hasCallRouting"],
  },
);
assert.equal(
  forwardingPlanDenialPayload({ id: "pro", name: "Pro", hasCallRouting: true, hasTransfer: true }),
  null,
);

console.log("PASS  PSTN forwarding routing, timing, policy, isolation, loop and duration guards");
