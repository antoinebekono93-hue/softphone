# Google Authentication Setup (Buster Call)

This guide explains how to enable the **Google** sign-in button on the Buster Call
login and register pages. Google is the **only** social provider wired up. Apple,
Meta/Facebook, Microsoft and GitHub are intentionally **not** implemented.

> ## Read this first — actual architecture
>
> Buster Call does **not** use Nhost Auth. Authentication is **NextAuth v5
> (Auth.js)** with a Credentials (email/password) provider and JWT sessions
> (see `auth.ts`). Nhost is used **only as the managed PostgreSQL host**
> (`DATABASE_URL` points at `…nhost.run`).
>
> Because of that, Google is added as a **NextAuth OAuth provider**, not through
> the Nhost Auth SDK. This keeps a single session architecture and reuses the
> existing Buster Call session, claim-refresh and onboarding flows.
>
> Google credentials therefore live in the **NextAuth environment variables**
> (`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`) and in **Google Cloud Console**.
> They are never placed in client code and never stored in the database.

---

## Project values detected from this repository

| Item | Value |
| --- | --- |
| Nhost project subdomain | `kgebwferveweznnuutxc` |
| Nhost region | `eu-central-1` |
| Nhost Auth URL (reference only, **not used for app auth**) | `https://kgebwferveweznnuutxc.auth.eu-central-1.nhost.run` |
| Local app URL (`NEXTAUTH_URL`) | `http://localhost:3000` |
| Production app URL | `<PRODUCTION_APP_URL>` — **placeholder, not yet known in this repo** |

> `<PRODUCTION_APP_URL>` is a real placeholder: no production URL is committed in
> `.env.local`. Replace it with the live Buster Call domain when deploying.

---

## A. Google Cloud Console

1. Go to <https://console.cloud.google.com/>.
2. Create (or select) a project, e.g. `Buster Call`.
3. The project is only used for **OAuth identity** — do not enable Gmail, Drive,
   Calendar, Contacts or YouTube APIs.

## B. OAuth consent screen

1. APIs & Services → **OAuth consent screen**.
2. User type: **External**.
3. App name: `Buster Call`.
4. User support email: your Buster Call support address.
5. Developer contact email: your engineering address.
6. **Scopes**: keep the defaults only — `openid`, `email`, `profile`.
   Do **not** add any Google product scope.
7. If the app must work for users outside a test list, publish the app
   (Verification). Anonymous Google logins require a non-testing state.

## C. Web OAuth Client

1. APIs & Services → **Credentials** → **Create credentials** → **OAuth client ID**.
2. Application type: **Web application**.
3. Name: `Buster Call Web`.

## D. Authorized JavaScript origins

Add each origin (scheme + host, **no** trailing slash, **no** path):

```
http://localhost:3000
<PRODUCTION_APP_URL>
```

Example once the production domain is known:

```
https://app.buster-call.example
```

## E. Authorized redirect URI

For a NextAuth integration the callback is always:

```
<ORIGIN>/api/auth/callback/google
```

Add both:

```
http://localhost:3000/api/auth/callback/google
<PRODUCTION_APP_URL>/api/auth/callback/google
```

> Note: this differs from what an Nhost Auth setup would use. If Buster Call ever
> migrates to Nhost Auth, the redirect URI would instead be the *OAuth Callback
> URL displayed by Nhost* for the Google provider. That is **not** the case
> today.

## F. Google Client ID

Copy the generated **Client ID** (ends with
`apps.googleusercontent.com`).

## G. Google Client Secret

Copy the generated **Client Secret**. Store it only as a server environment
variable. Never commit it, never expose it to the browser.

## H. Provider enablement

Add to the deployment environment (and to `.env.local` for local dev):

```dotenv
GOOGLE_CLIENT_ID="<CLIENT_ID>.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="<CLIENT_SECRET>"
```

The provider is registered **only when both variables are present**
(`googleEnabled` in `auth.ts`). If they are missing:

- the app still works with email/password;
- the Google button remains visible but the OAuth start will fail cleanly and
  show: *"Google sign-in could not be completed. Please try again."*

Restart the server after changing the variables.

> The names `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are the standard
> NextAuth names. Do **not** invent additional variables, and do **not** add them
> to any `NEXT_PUBLIC_*` variable — they are server-side secrets.

### About Nhost

- The Nhost Postgres database already backs this app. **No Nhost Auth
  configuration is required** for Google to work.
- Do **not** enable a Google provider inside Nhost Auth expecting the app to use
  it: the app's sessions come from NextAuth. Enabling it there would create a
  second, unused auth surface.
- Google credentials belong in the environment shown above, never in the
  `DATABASE_URL` or other Nhost connection settings.

## I. Buster Call redirect URLs

After Google completes, NextAuth hands control back to Buster Call:

1. `GET /api/auth/callback/google` — NextAuth creates the JWT session and links /
   provisions the Buster Call user (see the implementation report).
2. `GET /auth/redirect` — resolves the correct destination:
   - no organization or no phone number yet → `/onboarding`;
   - otherwise → the sanitized internal `next` path (default `/dashboard`).

The `next` parameter is validated by `lib/safe-redirect.ts`: only internal
Buster Call paths are accepted, so no external open redirect is possible.

---

## Pre-launch checklist

- [ ] Google Cloud OAuth consent screen configured (scopes: openid/email/profile).
- [ ] Web OAuth client created.
- [ ] Authorized JavaScript origins include local + production.
- [ ] Authorized redirect URIs include `…/api/auth/callback/google` for local + production.
- [ ] `GOOGLE_CLIENT_ID` set on the server.
- [ ] `GOOGLE_CLIENT_SECRET` set on the server (never committed).
- [ ] `NEXTAUTH_URL` / `AUTH_URL` set to the public app origin in production.
- [ ] Verify Google sign-in on desktop and mobile/PWA.
