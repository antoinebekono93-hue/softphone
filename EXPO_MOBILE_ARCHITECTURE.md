# Buster Call — Expo Mobile App Architecture

Status: **Phase 1 (Clavier / dialer) complete · Phase M2 (native Active Call) complete · Phase M3 (native Incoming Call) complete**.
Scope: additive native companion app. The existing Next.js web/PWA is untouched.

---

## A. Overview & goals

- Add a native Expo (React Native) app under `apps/mobile` as a companion to the existing
  Buster Call web/PWA.
- First screen: **Buster Call → Clavier** (dialer), matching the approved mobile dialer reference.
- Share platform-safe business logic with the web app through a new `packages/shared` package.
- Keep the native app independent so it can evolve (and eventually ship) without destabilising web.

## B. Non-goals & hard constraints

- Do **not** convert the root Next.js project into Expo, and do **not** remove Next.js.
- Do **not** move or rewrite web routes, Prisma schema, auth backend, Telnyx routing,
  App-to-App signaling, or billing.
- Do **not** enable root npm workspaces (React version conflict: web uses React 19.2.4 / Next 16,
  React Native requires a different React resolution). `apps/mobile` stays self-contained.
- The web app must remain functional and visually unchanged.
- Nothing is committed, pushed or deployed as part of this work.

## C. Repository layout

```
/ (Next.js web/PWA — unchanged)
├─ apps/mobile/            # new Expo app (self-contained)
│  ├─ app/                 # expo-router routes (phone/ + dev/active-call.tsx, dev/incoming-call.tsx)
│  ├─ components/          # native UI (dialer, shell, tab bar, active + incoming call…)
│  ├─ constants/theme.ts   # design tokens (web `.bc-light` parity)
│  ├─ hooks/               # useDialerState, useHaptics, useAppState, useCallDuration, useMockActiveCall, useMockIncomingCall
│  ├─ lib/                 # api client, config, auth + call (presentation/reducer/fixtures/engine/signal)
│  ├─ assets/              # icon / splash (copied from public/)
│  └─ app.json, metro.config.js, babel.config.js, tsconfig.json, eslint.config.js
└─ packages/shared/        # @buster/shared (platform-safe logic)
```

Root `tsconfig.json` now excludes `apps` and `packages`; root `eslint.config.mjs` ignores
`apps/**` and `packages/**`. The native app has its own tsconfig/eslint.

## D. Package strategy

- **No** root npm workspaces. Reason: a single hoisted React version cannot satisfy both
  Next 16 (React 19.2.4) and React Native (React 19.2.3) safely.
- `@buster/shared` is consumed by the mobile app via `"@buster/shared": "file:../../packages/shared"`.
  npm installs it as a symlink; Metro follows it because `metro.config.js` adds
  `watchFolders = [../../packages]`.
- `@buster/shared` declares `libphonenumber-js` as a **peerDependency** (and a direct dependency of
  the mobile app) so a single copy is resolved at runtime and there is no duplicate-install hazard.

## E. `@buster/shared`

Platform-safe modules only (no React, no DOM, no Node):

| File | Contents |
| --- | --- |
| `src/phone.ts` | `digitsOnly`, `isExplicitInternational`, `buildOutboundNumber`, `formatDisplayNumber` |
| `src/countries.ts` | `DialCountry`, `DEFAULT_DIAL_CODE`, `DIAL_COUNTRIES`, `countryByDialCode` |
| `src/call.ts` | `CallRouteType`, `CallRoute`, `CallErrorCode`, `PhoneTab`, contacts/calls/voicemails types |
| `src/constants.ts` | `BRAND_NAME`, `BRAND_TAGLINE`, `PHONE_TABS`, `CALL_ERROR_MESSAGES`, `callErrorMessage` |

## F. Native app structure (Expo Router, SDK 57)

```
app/_layout.tsx        # SafeAreaProvider + dark status bar + Stack (headerShown:false)
app/index.tsx          # redirect → /phone
app/phone/index.tsx    # <NativePhoneShell/>
app/+not-found.tsx     # fallback
```

- `NativePhoneShell` renders the shared header, the active tab content, and the bottom tab bar.
  The dialer stays mounted (`display:none` when inactive) so typed digits persist across tabs.
- Non-dialer tabs (Favoris, Récents, Contacts, Messagerie) render `ScreenPlaceholder`
  ("… apparaîtra ici") — explicit placeholders, not faked data.
- Tab state is local (mirrors the web `MobilePhoneShell`), not per-route, which keeps the tab bar
  persistent.

## G. Design system & theme parity

`constants/theme.ts` mirrors the approved **Mobile Phone Design System** block in
`app/globals.css` (the block marked "Source : dialer Clavier approuvé. Ne pas modifier les valeurs
validées sans revue visuelle."). This CSS is the design reference; the web dialer components were
never refactored onto it, so the native app is the first consumer of these tokens.

- Background: gradient `#f8fbff → #f3f7fb` (via `expo-linear-gradient`).
- Accent `#0a97b0` (+ hover/active/soft `rgba(10,151,176,0.12)`), success `#34c759` with glow
  `rgba(52,199,89,0.35)`, danger `#ff3b30`, warning `#ff9f0a`, ai `#6a5acd`.
- Surfaces / borders / text hierarchy exactly as the tokens, plus `surfaceTranslucent
  rgba(255,255,255,0.85)` and key surface `rgba(255,255,255,0.9)`.
- Spacing scale 4→40, radii 12/16/24/30/full, shadows sm/md/lg/float, header-logo and tabbar shadows.

Exact component metrics taken from the tokens:

| Element | Value |
| --- | --- |
| Header logo | 48×48, radius 16, gradient 135°, logo shadow |
| Header title / tagline | 30px/700 · 11px/500 uppercase tracking |
| Header profile | 56×56 circle |
| Number field | height 100, margin 0 20, radius 30, translucent + shadow md |
| Keypad | max-width 300, gap `clamp(14,4vw,20)` × `clamp(16,5vw,24)`, keys radius-full |
| Keypad digit / letters | 46px/500 · 13px/500 uppercase |
| Primary (call) | 88×88 green, shadow float |
| Secondary / icon buttons | 56×56 · 44×44 |
| Tab bar | top radius 24, translucent + blur, icon 48×28 radius 14, active `accentSoft` |

The keypad key size is bounded by both available width **and** available height (measured via
`onLayout`) so it never clips on short devices.

Deliberate native adaptations:

- The real OS status bar is used (`expo-status-bar`); the decorative simulated "9:41" bar from the
  design tokens is intentionally **not** rendered on device.
- The dialer uses the token `bc-header` brand header (logo + title + tagline + profile) as the
  approved reference. The web-only `Externe / Interne` segmented control and the App-to-App team
  directory mode are not part of this reference and are left for a later iteration.

Components: `NativeDialerHeader`, `NativeDialerNumberField`, `NativeCountryPicker`,
`NativeDialerKeypad`, `NativeCallActions`, `NativeBottomTabBar`, `NativeDialerScreen`,
`NativePhoneShell`, `NativeStatusBar`, `ScreenPlaceholder`.

Branding rule enforced: user-facing product name is **Buster Call** only; the forbidden terms
(Antigravity, Softphone, Telnyx) never appear in UI.

## H. Dialer behaviour parity (shared source of truth)

Reproduced natively via `@buster/shared`, identical to the web dialer:

1. **Outbound composition** (`buildOutboundNumber`): if the value starts with `+`, keep it; if it is
   already explicit international (`/^00\d+$/` or `/^237\d{9}$/`), keep it; otherwise drop a single
   leading `0` and prefix the selected country dial code.
2. **As-you-type formatting** (`formatDisplayNumber`) via `libphonenumber-js` `AsYouType`.
3. **Keypad**: 1 / 2 ABC … 9 WXYZ / `*` / `0 +` / `#`; long-press `0` (480 ms) inserts `+`.
4. **Country selector**: hidden while the number is in explicit-international form; backspace button
   clears the last digit.
5. Haptics on keypress / call (iOS + Android; no-op on web).

## I. API & auth boundary

- `lib/config.ts`: `EXPO_PUBLIC_API_BASE_URL` (default `http://localhost:3000`), `EXPO_PUBLIC_MOCK_AUTH`.
- `lib/api.ts`: typed `fetch` client (JSON, timeout/abort, `ApiError` with `code`), optional bearer
  token provider.
- `lib/client.ts`: shared API instance wired to the session token store.
- `lib/auth/`: `AuthAdapter` interface (`getSession` / `signIn` / `signOut`) with:
  - `sessionStore` backed by `expo-secure-store` (in-memory fallback on web),
  - `MockAuthAdapter` (dev, gated by `EXPO_PUBLIC_MOCK_AUTH=true`),
  - `UnconfiguredAuthAdapter` that clearly reports native sign-in is not wired yet.

**Current source of truth for auth is NextAuth (v5, JWT, cookie-based)** — browser-only today.
Native auth is therefore an interface + mock only; no real credential flow is implemented.

## J. Call execution audit

Server routing is reachable from the native app; media execution is not yet:

- `lib/call/native-call-service.ts`:
  - `resolveRoute(target)` → `POST /api/call-route` (shared with `hooks/useCallRouter.ts`),
    validates the `CallRoute` (`APP_TO_APP` | `APP_TO_PSTN`).
  - `NATIVE_CALL_EXECUTION = "PARTIAL"` — routing decision works, media handoff does not.
- The dialer's call button performs the **real** server routing decision and then reports that
  native audio (WebRTC) is not yet enabled, rather than pretending to place a call.

| Concern | Web implementation | Native compatibility |
| --- | --- | --- |
| Route decision | `POST /api/call-route` (`dispatchCallRoute`) | **Reusable** (HTTP) |
| PSTN media | `@telnyx/webrtc` (browser SDK) | `TELNYX_NATIVE_COMPATIBILITY = NOT_BROWSER_COMPATIBLE` |
| App-to-App media | WebRTC `RTCPeerConnection` + Pusher signaling | `APP_TO_APP_NATIVE = NEEDS_NATIVE_WEBRTC` |

Implementing native media (Telnyx React Native SDK or a native WebRTC path + signaling port) is a
separate, larger effort and is intentionally out of scope for Phase 1.

## K. Build, run & verify

```bash
# from repo root
npm run mobile            # expo start (dev server)
npm run mobile:android    # expo start --android
npm run mobile:ios        # expo start --ios
npm run mobile:lint       # eslint (mobile)
npm run mobile:typecheck  # tsc --noEmit (mobile)
```

Verified in this phase:

- `npx tsc --noEmit` (mobile) → **pass**
- `npx tsc --noEmit` (repo root) → **pass** (web unaffected)
- `npx expo lint` (mobile) → **0 errors**
- `npx expo export --platform android` → **bundled successfully** (1444 modules), confirming Metro
  resolves `@buster/shared`, the `@/` alias and the reanimated/worklets Babel plugin.

## L. Risks, open questions & next steps

**Open questions (need confirmation before production):**
- Bundle identifiers `com.merco.bustercall` (iOS/Android) are **proposed, not confirmed**.
- Native auth approach (decided: **keep mock for now**). Revisit whether to reuse NextAuth via a
  native-friendly token flow, or build a dedicated mobile session.
- Native media plan (Telnyx RN SDK vs. native WebRTC) and its billing/fair-use interplay.
  Decision for now: **keep the honest "not enabled" notice** rather than fake a call.
- Whether to add the web dialer's `Externe / Interne` mode (App-to-App team directory) to the
  native Clavier, since it is not part of the approved design reference.

**Risks:**
- Metro symlink resolution for `file:` packages — mitigated by `watchFolders`; validated by export.
- Expo/RN version drift vs. web React — mitigated by keeping the app self-contained.
- Heavy `npm install` for the RN tree (first install ~20 min on this machine; cache helps later).

**Next steps:**
1. Confirm bundle IDs + native auth direction.
2. Build the remaining tabs (Favoris, Récents, Contacts, Messagerie) against existing APIs.
3. Implement native call media (or a documented deep-link/bridge handoff) and re-audit fair-use.

---

## PHASE_M2_ACTIVE_CALL — Native Active Call experience

Goal: the **native Active Call screen**, its **state contract** and its **interaction architecture** —
UI only. No real media. This phase deliberately does **not** implement Telnyx native media, native
App-to-App WebRTC, CallKit, Android Telecom, push incoming calls, or browser SDK usage.

### M2.1 Capability boundary (what is *not* faked)

- No fake PSTN call, no fake App-to-App session, no Telnyx object in React Native.
- No browser `@telnyx/webrtc` SDK in RN, and no Telnyx-in-a-WebView workaround.
- The word "Connected" is never shown on its own; the running duration appears **only** for a state
  that is genuinely `ACTIVE`.
- No timer is ever started from a call that does not exist.

### M2.2 State contract (engine-agnostic)

`NativeCallPresentationState` (`lib/call/presentation.ts`):

```ts
{ status, displayName, displayNumber, avatarUri?, startedAt?, muted, speaker, callType?, failureReason? }
```

`status ∈ { IDLE, DIALING, RINGING, CONNECTING, ACTIVE, ENDING, ENDED, FAILED }`.

French status labels (`callStatusLabel`):

| Status | Label |
| --- | --- |
| DIALING | “Appel en cours…” |
| RINGING | “Sonnerie…” |
| CONNECTING | “Connexion…” |
| ACTIVE | *(running duration, `mm:ss` / `h:mm:ss`)* |
| ENDING | “Fin de l’appel…” |
| ENDED | “Appel terminé” |
| FAILED | controlled `failureReason` or “Appel impossible pour le moment.” |

Invariants:
- `isDurationVisible` ⇒ `status === "ACTIVE"` **and** a real `startedAt`. No duration otherwise.
- Terminal states reset `muted`/`speaker`/`startedAt` and close the keypad.
- Unknown enum names are never displayed; `callType` is optional and never rendered as a raw value.

### M2.3 UI state machine

`lib/call/active-call-reducer.ts` — pure reducer, no React / RN / SDK imports:

`ActiveCallUiState = { call, keypadOpen }`; actions `SET_STATUS`, `SET_CALL`, `TOGGLE_MUTE`,
`TOGGLE_SPEAKER`, `OPEN_KEYPAD`, `CLOSE_KEYPAD`, `HANGUP`, `RESET`. `HANGUP → ENDED` + full reset.

### M2.4 Engine boundary (declared, not implemented)

`lib/call/native-call-engine.ts` declares the `NativeCallEngine` interface
(`startCall`, `acceptCall`, `rejectCall`, `hangup`, `setMuted`, `setSpeaker`, `sendDTMF`,
`getState`, `subscribe`) and `NATIVE_CALL_ENGINE_STATUS = "NOT_IMPLEMENTED"`, plus
`NATIVE_CALL_CAPABILITIES = { media: false, audioRouting: false, dtmf: false }`.
The screen depends on a **props/adapter contract**, never on a Telnyx object.

### M2.5 Screen composition

`NativeActiveCallScreen` (light Buster theme, `LinearGradient` + safe areas, no bottom tab bar):

- **Identity**: avatar (112 px, 88 px compact) → `NativeCallerIdentity` with name (30 px/700, shrinks
  to fit) and number (16 px, blue-gray). Fallback order: real avatar → initials → generic user icon
  (no external avatar service).
- **Status/duration**: `NativeCallStatus` → `NativeCallDuration` (ticks only while `ACTIVE`).
- **Controls** (`NativeCallControlGrid` → `NativeCallControlButton`, ~68 px, 60 px compact):
  - Row 1: **Micro**, **Clavier**, **Haut-parleur** — always ≥44 px hit area, visibly selected via
    fill + icon colour + label colour (not opacity alone).
  - Row 2: **Ajouter**, **Vidéo**, **Contacts** — disabled honestly (no fake video/add).
- **Hangup**: `NativeHangupButton` — red circle 76 px, phone-down icon (`MaterialIcons` `call-end`),
  medium haptic, resets the mock/preview state.

### M2.6 In-call keypad

`NativeInCallKeypad` — bottom-sheet overlay reusing the dialer DNA but smaller (`layout.inCallKey`),
keys `1..9 * 0 #`, **no** country selector and **no** number field. UI/state only: it renders an
honest note that DTMF will be available later and never emits a fake DTMF tone.

### M2.7 Haptics & accessibility

- Control tap → light (`useHaptics.digit`); **hangup** → medium (`useHaptics.press`). No constant buzz.
- French labels: “Couper le microphone”, “Afficher le clavier”, “Activer le haut-parleur”,
  “Ajouter un appel”, “Appel vidéo”, “Contacts”, “Raccrocher”. Selected state is exposed
  semantically (`accessibilityState.selected`).

### M2.8 Responsiveness

Layout is bounded by available **height** (compact mode under 700 px) and width; the content is a
height-filling `ScrollView` so 320×568, 360×800, 375×812, 390×844, 393×852 and 430×932 all render
without clipping, vertical gaps compress before touch targets shrink, and safe-area insets keep
hangup clear of the home indicator. Portrait is primary; landscape degrades without crashing.

### M2.9 Dev preview & fixtures

`lib/call/fixtures.ts` (pure data, no network/media): `dialing`, `ringing`, `connecting`, `active`,
`unknown` (number-only identity), `failed`, `ended`.
`app/dev/active-call.tsx` (`__DEV__`-gated, redirects to `/phone` otherwise) renders the screen with
a fixture switcher, driven by `hooks/useMockActiveCall` + `hooks/useCallDuration`.

### M2.10 Web isolation

No change to `components/mobile/phone/**`, `contexts/TelnyxContext`, `contexts/AppCallContext` or
`CommunicationProvider`. The pure modules reuse only the **type** `CallRouteType` from
`@buster/shared` (erased at build) and import no `window` / `document` / `HTMLAudioElement` /
`next/*` / `next-auth`.

### M2.11 Verification

```bash
npm run test:mobile-active-call   # pure checks A–I, K, L (80 assertions)
npm run mobile:typecheck          # tsc --noEmit
npm run mobile:lint               # expo lint
```

Verified in this phase:

- `npx tsx scripts/test-native-active-call.ts` → **80/80 pass** (labels, duration gating, reducer,
  identity fallback, fixtures, no-Telnyx, no browser-only imports, capability flags).
- `npx tsc --noEmit` (mobile) → **pass**.
- `npx expo lint` (mobile) → **0 errors, 0 warnings**.
- `npx expo export --platform android` → **bundled successfully** (1461 modules).
- Long-name / overflow (check J) is **visual QA**, not asserted in the pure test.

### M2.12 Verdicts

| Dimension | Verdict |
| --- | --- |
| `NATIVE_ACTIVE_CALL_UI` | READY |
| `NATIVE_CALL_STATE_CONTRACT` | READY |
| `NATIVE_IN_CALL_KEYPAD` | READY (UI + state only) |
| `NATIVE_CALL_CONTROLS` | READY (UI contract only) |
| `NATIVE_AUDIO_ROUTING` | NOT_IMPLEMENTED |
| `NATIVE_DTMF` | NOT_IMPLEMENTED |
| `NATIVE_MEDIA_ENGINE` | NOT_IMPLEMENTED |
| `ANDROID_EXPO_EXPORT` | PASS |
| `IOS_NATIVE_BUILD` | NOT_RUN (no macOS/Xcode) |

---

## PHASE_M3_INCOMING_CALL — Native Incoming Call experience

Goal: the native **incoming-call** screen, its **presentation/state contract** and the
**accept/reject interaction architecture** — UI only. No real incoming-call delivery. Fixtures only.

### M3.1 Honest capability boundary (what is *not* faked)

- No real Telnyx call reception, no push registration, no APNs/FCM.
- No CallKit, no Android Telecom / `ConnectionService`.
- No fake ringing PSTN session, no Telnyx SDK call, no WebView.
- `accept`/`reject` operate on **mock/dev state only** and never claim real media or a real
  provider rejection. `ACTIVE` stays reserved for genuine media semantics (M2) and is **never**
  produced by the incoming reducer.

### M3.2 Extended presentation contract

Reuses `NativeCallPresentationState` (`lib/call/presentation.ts`). Added statuses
`INCOMING`, `ACCEPTING`, `DECLINING`, `MISSED`, plus an optional `direction: "incoming" | "outgoing"`.
No second call architecture: the same identity/duration helpers and `NativeCallerIdentity` /
`NativeCallStatus` / `NativeCallAvatar` components are reused from M2.

| Status | Label |
| --- | --- |
| INCOMING | “Appel entrant” |
| ACCEPTING | “Connexion…” |
| DECLINING | “Refus de l’appel…” |
| MISSED | “Appel manqué” |
| FAILED | controlled `failureReason` or “Appel impossible pour le moment.” |

`callSourceLabel(state)` maps `callType` → user-facing source text without exposing enums:

| callType | Label |
| --- | --- |
| APP_TO_APP | “Buster Call” |
| APP_TO_PSTN / PSTN_TO_APP | “Appel téléphonique” |

### M3.3 Transition contract

`lib/call/incoming-call-reducer.ts` (pure; `IncomingCallUiState = { call }`), with guarded
transitions (an action only applies from its expected source status):

```
INCOMING --ACCEPT-->  ACCEPTING --ADVANCE_CONNECTING--> CONNECTING   (mock preview; NOT ACTIVE)
INCOMING --DECLINE--> DECLINING --ADVANCE_ENDED------> ENDED
any -----MARK_MISSED-> MISSED        any --FAIL--> FAILED        any --DISMISS--> IDLE
```

`ADVANCE_CONNECTING` / `ADVANCE_ENDED` exist **only** to let the dev preview show the transition;
they are explicitly mock and never reach `ACTIVE`. The future real flow becomes
`INCOMING → ACCEPTING → CONNECTING → ACTIVE` (ACTIVE driven by the media engine, not this reducer).

### M3.4 UI

`NativeIncomingCallScreen` (light Buster theme, `LinearGradient` + safe areas, no tab bar):

- Top: source label (`callSourceLabel`) — “Buster Call” / “Appel téléphonique”.
- Identity: `NativeCallerIdentity` (avatar 112 px, 88 px compact; name 30 px/700 shrinking to fit;
  number 16 px). Identity fallback order unchanged: real avatar → initials → generic user icon.
- Status: `NativeCallStatus` (never shows a duration; incoming states are not `ACTIVE`).
- Actions: `NativeIncomingCallActions` = **Refuser** (red, `NativeCallRejectButton`) ·
  **Accepter** (green, `NativeCallAcceptButton`) — 76 px circles (68 px compact), ≥44 px hit area,
  medium haptic each. Reject uses the phone-down icon; accept the phone/answer icon.
- Terminal (`MISSED` / `FAILED` / `ENDED`): `NativeDismissButton` (“Fermer”) instead of actions.
  No “Me le rappeler” / callback is shown, because the native dialer cannot yet be pre-filled —
  showing it would be a fake affordance.

### M3.5 Source scans enforced by tests

No raw enums, provider IDs or technical strings reach the UI: “Telnyx” / `APP_TO_APP` /
`PSTN_TO_APP` never appear as user-facing text.

### M3.6 Foreground-only limitation (explicit)

This phase covers **foreground presentation only**. Real incoming calls while the app is
backgrounded, suspended, terminated, or the device is locked will require platform integrations
that are **not implemented** here:

- **iOS**: CallKit + a push strategy.
- **Android**: Telecom / `ConnectionService` + a notification/push strategy.

### M3.7 Push boundary (conceptual, not wired)

`lib/call/incoming-signal.ts` defines `NativeIncomingCallSignal`
(`callId`, `from`, `displayName?`, `callType`, `timestamp`) and
`NATIVE_PUSH_STATUS = "NOT_IMPLEMENTED"`. It is **not** bound to FCM/APNs/Telnyx.

### M3.8 Engine contract

`NativeCallEngine` (`lib/call/native-call-engine.ts`) now declares `acceptCall(callId)` and
`rejectCall(callId)` alongside `startCall`, `hangup`, `setMuted`, `setSpeaker`, `sendDTMF`,
`getState`, `subscribe`. Interface only — no fake production bodies.
`NATIVE_CALL_CAPABILITIES = { media: false, audioRouting: false, dtmf: false }` stays truthful.

### M3.9 Dev preview & fixtures

`lib/call/fixtures.ts` → `INCOMING_CALL_FIXTURES` (pure data; no network/media): known contact,
unknown number, APP_TO_APP, PSTN, accepting, declining, missed, failed, long name.
`app/dev/incoming-call.tsx` (`__DEV__`-gated, redirects to `/phone` otherwise) renders the screen
with a fixture switcher via `hooks/useMockIncomingCall` + an explicit mock timer for the
ACCEPTING→CONNECTING and DECLINING→ENDED preview steps.

### M3.10 Verification

```bash
npm run test:mobile-incoming-call   # pure checks A–M (96 assertions)
npm run test:mobile-active-call     # M2 regression (80 assertions)
npm run mobile:typecheck
npm run mobile:lint
```

Verified in this phase:

- `npx tsx scripts/test-native-incoming-call.ts` → **96/96 pass**.
- `npx tsx scripts/test-native-active-call.ts` → **80/80 pass** (M2 not broken).
- `npx tsc --noEmit` (mobile) → **pass**.
- `npx expo lint` (mobile) → **0 errors, 0 warnings**.
- `npx expo export --platform android` → **bundled successfully** (1469 modules).
- Long-name overflow (check H) is **visual QA**, not asserted in the pure test.

### M3.11 Verdicts

| Dimension | Verdict |
| --- | --- |
| `NATIVE_INCOMING_CALL_UI` | READY |
| `NATIVE_INCOMING_CALL_STATE_CONTRACT` | READY |
| `NATIVE_ACCEPT_REJECT_UI` | READY |
| `NATIVE_INCOMING_CALL_DELIVERY` | NOT_IMPLEMENTED |
| `NATIVE_PUSH` | NOT_IMPLEMENTED |
| `IOS_CALLKIT` | NOT_IMPLEMENTED |
| `ANDROID_TELECOM` | NOT_IMPLEMENTED |
| `NATIVE_MEDIA_ENGINE` | NOT_IMPLEMENTED |
| `M2_REGRESSION` | PASS |
| `ANDROID_EXPO_EXPORT` | PASS |
| `IOS_NATIVE_BUILD` | NOT_RUN (no macOS/Xcode) |
| `INCOMING_CALL_VISUAL_QA` | NOT_RUN (no emulator/device/browser inspection available) |

### M3.12 Future M4

Real media integration (native Telnyx media or native WebRTC App-to-App + signaling port), then
platform call surfaces (CallKit / Android Telecom) and push (APNs/FCM), with the fair-use/billing
re-audit. Out of scope for M3.

### M3.13 STOP boundary respected

Not implemented in M3: Telnyx native media, Telnyx push, APNs, FCM, CallKit, Android Telecom,
native App-to-App WebRTC, background/terminated-app incoming calls, Contacts/Recents/Messaging tabs.
No web/PWA changes. Nothing committed, pushed or deployed.

## PHASE_M4_NATIVE_MEDIA_ENGINE - Native media engine (foreground) & real call core

M4 is the first *real* media phase: it replaces the `NOT_IMPLEMENTED` engine boundary of M2/M3
with an adapter that drives actual provider media through the existing `NativeCallEngine`
interface. Scope is **foreground only**. No push, no CallKit / Android Telecom, no
background/terminated-app delivery, no native App-to-App, no live calls in tests.

### M4.1 Stack audit (Expo + React Native)

| Fact | Value |
| --- | --- |
| Expo SDK | `~57.0.28` |
| React Native | `0.86.3` |
| React | `19.2.3` |
| Managed or prebuild | managed (no `ios/` / `android/` folders) |
| New Architecture | enabled |

The Telnyx voice SDKs for React Native ship **native modules** and therefore **cannot run in
Expo Go**. They require a *prebuild* / custom dev client (`expo prebuild`, then
`expo run:android` / Expo EAS dev build). Installation also needs `--legacy-peer-deps` because of
React peer-range conflicts. See `M4.2`.

### M4.2 SDK selection & integration level

Two candidates were audited:

- `@telnyx/react-native-voice-sdk` — low-level call objects (`newCall`, per-call `answer` /
  `hangup` / `mute` / `dtmf`, call-state events). **Selected (Option A).**
- `@telnyx/react-voice-commons-sdk` — high-level `TelnyxVoipClient` + `TelnyxVoiceApp` that own a
  **central call-state machine**. Rejected: it would duplicate/conflict with the M2
  `active-call-reducer` and M3 `incoming-call-reducer` contract.

Decision: integrate at the **lowest sufficient layer**. Buster Call keeps its own reducers as the
single source of truth and consumes the SDK through a thin port. No custom Swift/Kotlin bridge,
no WebView, and **no reuse of `@telnyx/webrtc`** (browser SDK) in React Native.

The SDK is installed at **v1.2.1** in `apps/mobile` with `--legacy-peer-deps`. The business logic
stays behind a *hand-rolled port* so it remains testable without the SDK; a real binding
(`telnyx-sdk-adapter.ts`) translates the concrete `TelnyxRTC` / `Call` objects into that port.

The package ships its raw TypeScript as `types`, and that source does not compile under our strict
config (upstream TS errors, plus undeclared runtime imports of `@react-native-async-storage/async-storage`
and `rxjs`). The two missing runtime dependencies were installed, and `apps/mobile/types/telnyx-sdk.d.ts`
is mapped via `compilerOptions.paths` for typechecking only — Metro still resolves the real package
at runtime.

### M4.3 Added files (`apps/mobile/lib/call/`)

| File | Role |
| --- | --- |
| `telnyx-voice-port.ts` | Minimal provider surface (`TelnyxVoiceClientPort`, `TelnyxVoiceCallPort`, `TelnyxNewCallParams`) + `telnyxVoiceCapabilities`. No native import. |
| `telnyx-event-map.ts` | Deterministic provider-state → Buster-state normalization (`mapTelnyxCallState`, failure/terminal detectors). Unknown ⇒ `null` (never ACTIVE). |
| `microphone-permission.ts` | `MicrophonePermissionPort`; `MICROPHONE_PERMISSION_DENIED`; `createGrantedMicrophonePermission`. |
| `native-call-authorization.ts` | Reuses the **existing** `POST /api/telnyx/preauthorize` handshake; `NATIVE_CALL_AUTHORIZATION_STATUS = "READY"`. |
| `native-telnyx-token.ts` | Token boundary; `NATIVE_TELNYX_AUTH_STATUS = "BLOCKED_BY_NATIVE_AUTH"`. |
| `telnyx-native-call-engine.ts` | `TelnyxNativeCallEngine implements NativeCallEngine`; `NATIVE_MEDIA_ENGINE_STATUS = "PARTIAL"`; `NATIVE_UNSUPPORTED_ERROR = "NATIVE_OPERATION_UNSUPPORTED"`. |
| `telnyx-sdk-adapter.ts` | **Real SDK binding** (`createTelnyxSdkClient`): `login_token` → `TelnyxRTC`, async `newCall` → call port, SDK state events → engine. Forwards `clientState` for billing correlation. |

The M2/M3 pure modules (`presentation.ts`, `active-call-reducer.ts`, `incoming-call-reducer.ts`,
`incoming-signal.ts`, `native-call-engine.ts`, `fixtures.ts`) are **untouched**: their
Telnyx/window/document/next/react-native-free source scans and the `NATIVE_CALL_ENGINE_STATUS =
"NOT_IMPLEMENTED"` / all-false `NATIVE_CALL_CAPABILITIES` assertions still hold.

### M4.4 Authentication boundary (honest)

Production Telnyx login material is obtained by the **server** (`GET /api/telnyx/token`, gated by a
NextAuth session). The native app currently uses the **mock** auth adapter
(`MockAuthAdapter` / `UnconfiguredAuthAdapter`, `accessToken = null` via `EXPO_PUBLIC_MOCK_AUTH`),
which cannot call that endpoint. Per the M4 rule, the engine architecture and adapter are delivered
but production token acquisition stays **BLOCKED**:

- `NATIVE_TELNYX_AUTH = BLOCKED_BY_NATIVE_AUTH` (until a secure native auth path exists).
- No Telnyx API key, SIP password or connection secret is embedded or logged. JWT/credentials are
  never logged.

### M4.5 Authorization & billing boundary (reused, not bypassed)

Native PSTN dialing reuses the authoritative server handshake rather than inventing a parallel path:

1. `POST /api/telnyx/preauthorize` resolves the route, requires `APP_TO_PSTN`, finds the ACTIVE
   assigned `PhoneNumber`, creates a `CallLog` (`telnyxCallControlId = pending:<attemptId>`) and
   runs plan/balance checks (`preAuthorizeCall` in `lib/pstn-billing`).
2. It returns `{ attemptId, destination, callerNumber, clientState }` where `clientState` is the
   base64 `{ outboundAttemptId }` used by the web flow (`contexts/TelnyxContext.tsx`).
3. The engine forwards `clientState` to the provider's `newCall`, so the telecom webhook
   (`app/api/webhooks/telecom/route.ts`) can correlate `client_state.outboundAttemptId`.
4. If authorization is denied, `startCall` throws **before** any provider `newCall` — no bypass.

### M4.6 Provider state mapping (verified deterministically)

`new` → `DIALING`, `early`/`ringing` → `RINGING`, `connecting` → `CONNECTING`, `active`/`held` →
`ACTIVE`, `hangup` → `ENDING`, `destroy`/`ended` → `ENDED`, `failed`/`error`/`dropped` → `FAILED`.
Incoming: `ringing` → `INCOMING`. The real SDK emits `connecting` / `ended` / `dropped`, so these
are mapped explicitly. Any unknown / malformed value → `null`, so the engine **never** flips to
ACTIVE on an unrecognized event.

### M4.7 Invariants enforced by the engine

- `ACTIVE` is set **only** on a confirmed provider media/session state (`active`/`held`), never on
  button press, token acquisition, socket connect or call-object creation.
- The engine owns mic enablement, remote audio and call lifecycle — one owner.
- `hangup` is idempotent (single provider `hangup` call across double taps / effects / callbacks).
- Microphone permission is required before any `newCall`.

### M4.8 Capabilities & unsupported operations

- Supported: start PSTN call, provider-driven state, mute/unmute, DTMF (when the call exposes it),
  hangup, disconnect/cleanup.
- Reported unsupported: speaker/audio-route selection (`setSpeaker` → controlled error), and any
  operation not exposed by the current call.

### M4.9 Native App-to-App

`NATIVE_APP_TO_APP = NOT_IMPLEMENTED`. Internal App-to-App is explicitly **not** routed through
PSTN (no Telnyx per-minute charges for internal calls). Future M5/M6.

### M4.10 Web isolation

No web change: `contexts/TelnyxContext.tsx`, the web Softphone, the `@telnyx/webrtc` integration
and the web App-to-App `RTCPeerConnection` flow are untouched. No web/PWA file modified.

### M4.11 Verification

| Check | Result |
| --- | --- |
| `apps/mobile` `tsc --noEmit` | PASS |
| Root `tsc --noEmit` | PASS |
| Mobile ESLint (Expo flat config) on the 8 new/modified files | PASS (0 problems) |
| `@telnyx/react-native-voice-sdk@1.2.1` install (`--legacy-peer-deps`) | PASS |
| `npx expo prebuild --platform android --no-install` | PASS |
| `npm run test:mobile` | PASS |
| `npm run test:mobile-detail` | PASS |
| `npm run test:mobile-active-call` | PASS (80/80) |
| `npm run test:mobile-incoming-call` | PASS (96/96) |
| `npm run test:mobile-media-engine` | PASS (132/132) |

The M4 suite (`scripts/test-native-media-engine.ts`) covers: engine init & unsubscribe, no
embedded token, `startCall` → DIALING, ACTIVE only after provider `active`, provider failure →
FAILED (including a rejected async `newCall`), hangup exactly once, mute routes once, DTMF routing
+ unsupported error, permission denied blocks the call, provider disconnect cleans the session,
source scans (no browser API / WebView / `@telnyx/webrtc` / secret), the M2/M3 boundary invariants,
the full §26 mapping (including the SDK's `connecting` / `ended` / `dropped` states), the reused
authorization pipeline and the blocked token boundary. No real phone call is placed.

### M4.12 Verdicts

| Dimension | Verdict |
| --- | --- |
| `TELNYX_RN_SDK_AUDIT` | READY |
| `SELECTED_NATIVE_SDK` | `@telnyx/react-native-voice-sdk@1.2.1` (Option A, low-level) |
| `EXPO_COMPATIBILITY` | NEEDS_PREBUILD (Expo Go insufficient) |
| `ANDROID_PREBUILD` | PASS |
| `NATIVE_TELNYX_AUTH` | BLOCKED_BY_NATIVE_AUTH |
| `NATIVE_CALL_AUTHORIZATION` | READY (reuses `/api/telnyx/preauthorize`) |
| `NATIVE_MEDIA_ENGINE` | PARTIAL |
| `NATIVE_PSTN_OUTGOING` | PARTIAL |
| `NATIVE_APP_TO_APP` | NOT_IMPLEMENTED |
| `NATIVE_AUDIO_ROUTING` | NOT_IMPLEMENTED (declared unsupported) |
| `NATIVE_DTMF` | PARTIAL (supported when the call exposes it) |
| `NATIVE_PUSH` | NOT_IMPLEMENTED |
| `IOS_CALLKIT` | NOT_IMPLEMENTED |
| `ANDROID_TELECOM` | NOT_IMPLEMENTED |
| `M2_REGRESSION` | PASS |
| `M3_REGRESSION` | PASS |
| `PHONE_TABS_REGRESSION` | PASS |
| `LIVE_NATIVE_CALL_TEST` | NOT_RUN (no device/emulator/credit) |
| `ANDROID_NATIVE_BUILD` | NOT_RUN (prebuild generated; Gradle/device build not executed) |
| `IOS_NATIVE_BUILD` | NOT_RUN (no macOS/Xcode, iOS prebuild not generated) |
| `PHASE_M4_FINAL_READINESS` | BLOCKED_BY_NATIVE_AUTH |

### M4.13 STOP boundary respected

Not implemented in M4: Telnyx push, APNs, FCM, CallKit, Android Telecom, background/terminated-app
calls, native App-to-App WebRTC, live production call test, native auth. The SDK is installed and
the real binding exists but is not activated in production. No web/PWA change. Nothing committed,
pushed or deployed.
