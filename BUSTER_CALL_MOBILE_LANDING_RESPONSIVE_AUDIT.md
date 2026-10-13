# Buster Call — Mobile Landing Responsive Audit

Date: 2026-10-11. Scope: public landing `/` and shared marketing header/footer. No commit, push or deployment. Existing unrelated edits preserved.

## MOBILE_RESPONSIVE_AUDIT — initial findings

Hero jumped to 88px at 768px; large margins delayed actions. Feature cards had 300px minimum/fixed heights and absolute graphics. Stats used two columns at 320px with 32px padding. Final CTA used 128px vertical padding and a 48px mobile heading. Header hid registration below 640px. Root overflow-x-hidden concealed overflow. Trust marquee duplicated unbroken content at 200% width. Footer lacked safe-area padding and comfortable link targets. No raster or Next/Image assets appear in this landing.

## A. Fixed sizing

Shared mobile-first classes replace repeated fixed section/card/headline sizing. Content-height cards, minmax(0, 1fr) grids, bounded illustrations and fluid padding. Fixed icon sizes remain deliberate. Desktop feature rows use minimum heights instead of fixed clipping heights.

## B. Overflow

Removed root overflow-x-hidden. Stats begin with one column; feature transcript, avatars and chart use normal flow. Bounded globe; mobile browser chrome shows readable address without crowded decorations. Trust becomes a wrapping, nonduplicated list. Local overflow clipping remains only for rounded mockup surfaces and decorative effects. Runtime scrollWidth/clientWidth NOT MEASURED; no CLEAN claim.

## C. Typography

Hero clamp(1.875rem, 7.2vw, 3rem) on phones, with fluid desktop growth to original 5.5rem cap. Section headings 1.65–2.5rem (feature heading to 3rem), card headings 1.25–1.875rem. Main body starts at 1rem. Balanced wrapping, no forced hero/final-CTA break. Hero copy max 52ch; section introductions 65ch; footer prose 70ch.

## D. Spacing

Gutters 1–2rem; sections 2.75–6rem; cards 1.25–2rem, with smaller heading gaps. Mobile actions stack with a 22rem maximum and minimum 44px height, becoming inline in wider containers. Hero has no viewport-filling height.

## E. Container queries

Sections, content panels, preview and footer declare inline-size containment. At 36rem, cards/stats/compliance use two columns and actions become inline; at 42rem, feature/panel layouts gain columns; at 60rem, features/resources/guarantees use three columns and stats four. Footer grows from one to two/four/five columns. Unsupported browsers retain usable single-column base styles. Global hero/navigation changes use viewport media queries. No resize-driven JS or added dependencies.

## F. Viewport units

Root min-h-screen replaced with 100svh. Hero remains content-driven. Drawer uses 100dvh minus header/top safe area, with a vh fallback. Zoom metadata unchanged: device-width, initialScale 1, viewportFit cover; no maximumScale.

## G. Images

No raster images or Next/Image are mounted: no downloads or sizes attributes to optimize. Product preview is HTML/CSS with inline SVG. It retains readable phone content; browser decorations appear when the container is wide enough. Decorative dimensions stay explicit. No image performance measurements claimed.

## H. Hero

Badge → headline → description → primary CTA → pricing CTA → existing expert CTA → trust notes → product preview. Existing content, brand, logo and color system retained. Primary content does not wait for reveal animation. Compact mobile column; expansive centered desktop composition.

## I. Section behavior

| Section | Mobile behavior |
| --- | --- |
| Header | Compact logo, visible registration CTA and 44px menu. Theme control moves into narrow drawer. Full nav at 1280px. |
| Hero | Fluid headline, bounded stacked actions, readable trust notes/softphone. |
| Trust | Wrapping capabilities list with no duplicate scrolling text. |
| Product tabs | Wrapping selectors, pressed state, single-column text; redundant visual returns when panel permits. |
| Features / AI | Content-height cards, flow-based transcript/avatars/chart, bounded globe. |
| Stats | One, two, then four columns; labels wrap. |
| Use cases | One then two columns, wrapping tags. |
| Guarantees | One, two, then three columns. |
| Industries | Wrapping selectors, stacked bullets, content-first panel. |
| Compliance | One/two columns of compact rounded cards. |
| Resources | One/two/three columns of compact cards. |
| Integrations | Wrapping names, reduced gaps, readable opacity. |
| Final CTA | Fluid title with no forced break; bounded stacked actions. |
| Footer | One column on smallest phones, progressively wider grid; 44px links. |
| Testimonials / FAQ / pricing preview | Absent from original landing; no invented content added. Pricing links retained. |

## J. Safe areas

Top inset included in fixed header, drawer offset, hero start and anchor scrolling. Bottom inset included in drawer/footer. Horizontal insets included in header/footer.

## K. Accessibility

One main landmark now contains landing content. Added landing skip link, visible focus styles and aria-pressed/aria-controls on selectors. Drawer retains inert/expanded/label semantics. Escape closes it and restores trigger focus; leaving header closes it. Minimum 44px action/link heights. Reduced-motion handling retained and decorative ping disabled when requested. Existing resource buttons have no action handlers (pre-existing, outside responsive scope). Contrast, keyboard operation, screen readers and zoom/reflow require live verification; no accessibility certification claimed.

## L. QA sizes

Requested widths: 320, 360, 375, 390, 393, 412, 430, 768, 1024, 1280, 1440px.
Requested screenshots: 320x568, 375x667, 390x844, 393x852, 430x932.
NONE marked tested. agent-browser 0.27.0 installed/available, but both open attempts failed with Windows socket error 10060. Connected browser also timed out. No screenshots or fabricated overflow results.

## M. TypeScript / lint

Initial npx tsc --noEmit: PASS, exit 0. Initial targeted lint found existing JSX escaping errors and effect-driven menu reset; both corrected. Final targeted ESLint: PASS (zero errors or warnings). Final npx tsc --noEmit: PASS (exit 0). git diff --check also passed.

## N. Build

npm run build: BLOCKED, exit 1 in Prisma migration after four retries. For local UI validation DATABASE_URL and DIRECT_URL were deliberately set to inactive loopback port 1 so no remote database migration could run; environment files unchanged.
Direct next build --webpack: compilation succeeded (reported 22.5min), then completed TypeScript validation (21.8min). PASS: direct production build completed with exit 0, all 205 static pages generated, including the landing route. Existing Sentry and unavailable-database warnings remain; this does not validate live backend services. Existing Sentry instrumentation warnings. Core Web Vitals NOT MEASURED.

## O. Remaining checks and verdicts

Live screenshots, wrapping, overflow, keyboard navigation, contrast, desktop comparison and real iOS safe-area/address-bar behavior remain unverified. Shared header/footer affect other public routes too. READY below means source-level readiness only; visual acceptance remains outstanding.

MOBILE_HERO = NEEDS_WORK
MOBILE_TYPOGRAPHY = READY
MOBILE_LAYOUT = NEEDS_WORK
MOBILE_IMAGES = READY
MOBILE_OVERFLOW = NEEDS_WORK
MOBILE_ACCESSIBILITY = NEEDS_WORK
RESPONSIVE_STATIC_READINESS = READY
VISUAL_QA = NOT_RUN

Hero/layout NEEDS_WORK denotes missing visual acceptance, not a concealed measured failure. No commit or push performed.
