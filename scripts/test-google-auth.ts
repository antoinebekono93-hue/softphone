import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { isSafeInternalPath, sanitizeInternalRedirect } from "../lib/safe-redirect";
import { canStartGoogleAuth, GOOGLE_AUTH_ERROR_MESSAGE } from "../lib/google-auth";

const root = join(__dirname, "..");
const read = (relative: string) => readFileSync(join(root, relative), "utf8");

let checks = 0;
function check(label: string, fn: () => void) {
  fn();
  checks++;
  console.log(`  ok - ${label}`);
}

console.log("Google auth readiness tests");

// ---------------------------------------------------------------------------
// F / G. Redirect security (open-redirect protection)
// ---------------------------------------------------------------------------
check("F. accepts internal Buster Call paths", () => {
  assert.equal(isSafeInternalPath("/dashboard"), true);
  assert.equal(isSafeInternalPath("/dashboard/settings?tab=profile"), true);
  assert.equal(isSafeInternalPath("/onboarding/number"), true);
  assert.equal(sanitizeInternalRedirect("/dashboard/softphone"), "/dashboard/softphone");
});

check("G. rejects external / protocol-relative / malformed targets", () => {
  for (const bad of [
    "https://evil.com",
    "http://evil.com/steal",
    "//evil.com",
    "/\\evil.com",
    "javascript:alert(1)",
    "/%2F%2Fevil.com",
    "dashboard",
    "   ",
    "",
    null,
    undefined,
    42,
  ]) {
    assert.equal(isSafeInternalPath(bad as unknown), false, `should reject ${String(bad)}`);
  }
  assert.equal(sanitizeInternalRedirect("https://evil.com", "/dashboard"), "/dashboard");
  assert.equal(sanitizeInternalRedirect(undefined, "/onboarding"), "/onboarding");
});

// ---------------------------------------------------------------------------
// D / E. Button states
// ---------------------------------------------------------------------------
check("D. duplicate OAuth starts are blocked while loading or disabled", () => {
  assert.equal(canStartGoogleAuth("idle", false), true);
  assert.equal(canStartGoogleAuth("loading", false), false, "loading must block re-click");
  assert.equal(canStartGoogleAuth("idle", true), false, "disabled must block click");
  assert.equal(canStartGoogleAuth("error", false), true, "error allows retry");
});

check("E. error copy is the exact clean message", () => {
  assert.equal(
    GOOGLE_AUTH_ERROR_MESSAGE,
    "Google sign-in could not be completed. Please try again."
  );
});

// ---------------------------------------------------------------------------
// A. Email/password auth preserved
// ---------------------------------------------------------------------------
const loginPage = read("app/login/page.tsx");
const registerPage = read("app/register/page.tsx");
const authTs = read("auth.ts");

check("A. login page keeps the email/password form", () => {
  assert.match(loginPage, /signIn\("credentials"/);
  assert.match(loginPage, /name="email"/);
  assert.match(loginPage, /name="password"/);
  assert.match(registerPage, /registerUser/);
  assert.match(registerPage, /name="email"/);
  assert.match(registerPage, /name="password"/);
});

check("A. CredentialsProvider still registered in auth.ts", () => {
  assert.match(authTs, /CredentialsProvider\(/);
  assert.match(authTs, /async authorize\(credentials\)/);
});

// ---------------------------------------------------------------------------
// B. Google button renders on both auth pages
// ---------------------------------------------------------------------------
check("B. Google button is wired into login and register", () => {
  assert.match(loginPage, /GoogleAuthButton/);
  assert.match(registerPage, /GoogleAuthButton/);
  assert.match(loginPage, /or continue with email/i);
  assert.match(registerPage, /Google/i);
});

const button = read("components/auth/GoogleAuthButton.tsx");
check("B. Google button renders icon + label + all three states", () => {
  assert.match(button, /GoogleIcon/);
  assert.match(button, /"idle" \| "loading" \| "error"|GoogleAuthStatus/);
  assert.match(button, /status === "loading"/);
  assert.match(button, /status === "error"/);
  assert.match(button, /min-h-11/, "must be >= 44px high");
  assert.match(button, /w-full/, "must be full width for mobile");
  assert.match(button, /signIn\("google"/);
});

// ---------------------------------------------------------------------------
// C. Only Google OAuth provider is enabled
// ---------------------------------------------------------------------------
check("C. auth.ts registers Google and only Google", () => {
  assert.match(authTs, /GoogleProvider/);
  assert.match(authTs, /oauthAllowedProviders = new Set\(\["google"\]\)/);
  for (const forbidden of ["Apple", "Facebook", "Microsoft", "GitHub", "Github", "LinkedIn"]) {
    assert.doesNotMatch(authTs, new RegExp(forbidden, "i"), `${forbidden} must not be configured`);
  }
});

check("C. Google provider is guarded by env credentials (no hardcoded secrets)", () => {
  assert.match(authTs, /process\.env\.GOOGLE_CLIENT_ID/);
  assert.match(authTs, /process\.env\.GOOGLE_CLIENT_SECRET/);
  assert.match(authTs, /googleEnabled/);
  assert.doesNotMatch(authTs, /clientId:\s*"|clientSecret:\s*"/, "no hardcoded credentials");
});

// ---------------------------------------------------------------------------
// H. Organization bootstrap reuses the email/password provisioning path
// ---------------------------------------------------------------------------
check("H. OAuth provisioning reuses the shared organization helper", () => {
  const registerActions = read("app/register/actions.ts");
  const provisioning = read("lib/oauth-provisioning.ts");
  const orgProvisioning = read("lib/organization-provisioning.ts");
  assert.match(registerActions, /provisionOrganizationWithAdmin/);
  assert.match(provisioning, /provisionOrganizationWithAdmin/);
  assert.match(orgProvisioning, /role: "ADMIN"/);
  assert.match(orgProvisioning, /planStatus: "TRIALING"/);
});

check("H. brand-new Google users are not left without an organization", () => {
  const redirectPage = read("app/auth/redirect/page.tsx");
  assert.match(redirectPage, /redirect\("\/onboarding"\)/);
  assert.match(redirectPage, /hasOrganization/);
});

// ---------------------------------------------------------------------------
// I. Session refresh reuses the existing claim logic
// ---------------------------------------------------------------------------
check("I. OAuth first sign-in refreshes claims through accountSessionClaims", () => {
  assert.match(authTs, /accountSessionClaims/);
  assert.match(authTs, /if \(account && account\.type !== "credentials"\)/);
  assert.match(authTs, /resolveOrProvisionOAuthUser/);
});

// ---------------------------------------------------------------------------
// J. Logout clears private local data (existing offline-store helper reused)
// ---------------------------------------------------------------------------
check("J. private local data cleanup helper exists for logout", () => {
  const offlineStore = read("lib/offline-store.ts");
  assert.match(offlineStore, /clearPrivateLocalStorage/);
});

// ---------------------------------------------------------------------------
// K. Google disabled -> credentials-only app still works
// ---------------------------------------------------------------------------
check("K. app stays functional when Google env vars are missing", () => {
  assert.match(authTs, /googleEnabled/);
  assert.match(authTs, /\.\.\.\(googleEnabled[\s\S]*?\?/);
  assert.match(authTs, /:\s*\[\]\)/);
});

// ---------------------------------------------------------------------------
// Account settings shows login methods
// ---------------------------------------------------------------------------
check("Login methods section reports Google connection status", () => {
  const settings = read("app/dashboard/settings/page.tsx");
  assert.match(settings, /Login methods/i);
  assert.match(settings, /Connected/);
  assert.match(settings, /Not connected/);
  assert.match(settings, /provider: "google"/);
});

// ---------------------------------------------------------------------------
// Scopes: authentication only, no Google API access
// ---------------------------------------------------------------------------
check("Google scopes stay minimal (openid email profile only)", () => {
  assert.match(authTs, /scope: "openid email profile"/);
  for (const api of ["gmail", "drive", "calendar", "contacts", "youtube"]) {
    assert.doesNotMatch(authTs, new RegExp(api, "i"), `${api} scope must not be requested`);
  }
});

console.log(`\nAll ${checks} Google auth checks passed.`);
