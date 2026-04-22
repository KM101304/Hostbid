# HostBid UI Visual Audit

Date: 2026-04-22
Auditor: Codex
Environment: local `next dev` on Next.js `16.2.4`
Capture set: `tmp/ui-audit/*.png`

## Scope

This audit was based on actual rendered screenshots, not just JSX review.

Routes reviewed:

- `/`
- `/login`
- `/signup`
- `/dashboard`
- `/experiences/new`
- `/profile`
- `/messages`
- `/messages/[threadId]`
- `/moderation`
- `/experiences/[id]`

Viewport coverage:

- Desktop: `1440x1100`
- Mobile: `390x844`

Current environment limits:

- Supabase schema is not present in this environment, so discovery data is empty.
- Authenticated routes redirect to `/login` when signed out, so the audit reflects the real signed-out experience for those pages.
- `/experiences/[id]` currently renders the default Next.js `404` state for a missing experience.

## Executive Summary

The app already has a clear visual direction: soft glass cards, restrained color, good type scale, and a polished editorial tone. The strongest pages are the auth screens on desktop, where the marketing copy and form card create a clean two-column composition.

The biggest issues are structural rather than stylistic:

1. Primary CTAs and brand accents are visually broken because the gradient utility is not rendering.
2. The mobile fixed bottom nav overlaps important content in the first viewport.
3. The mobile header compresses poorly and makes core actions feel broken or hidden.
4. Empty and missing-data states are not yet designed with the same care as the main marketing surfaces.

## Highest-Priority Findings

### 1. Primary buttons and logo treatment are effectively broken

Severity: High

Observed visually:

- The top-right primary action in the header appears as an almost empty outlined pill.
- The hero primary CTA on `/` appears washed out to near-invisible.
- The `HB` mark in the nav is missing its intended filled badge treatment.

Likely cause:

- `src/components/ui/button.tsx`
- `src/components/layout/top-nav.tsx`

Both use `bg-[var(--gradient-primary)]`. In Tailwind, `bg-*` maps to background-color, but `--gradient-primary` contains a `linear-gradient(...)` value. That makes the fill invalid, so white text sits on a white background.

Impact:

- Primary actions do not read as clickable.
- Brand recognition drops immediately in the header.
- The most important conversion paths look disabled even when they are not.

Recommendation:

- Replace this pattern with a gradient-capable utility or class such as `bg-linear-[...]`, `bg-[image:var(--gradient-primary)]`, or a dedicated CSS class that sets `background-image`.

### 2. Mobile bottom navigation obscures live content

Severity: High

Observed visually:

- On `/`, the fixed bottom nav cuts across the transition from the hero to the next card in the first viewport.
- On `/login`, the bottom nav sits directly over the page, hiding the beginning of the form card.

Likely cause:

- `src/components/layout/top-nav.tsx`
- `src/components/layout/app-shell.tsx`

The nav is fixed on mobile, and `pb-24` is only protecting the very end of the page, not the fact that a fixed element is always covering the viewport bottom while the user reads.

Impact:

- First-scroll readability is reduced.
- It feels like content is tucked under chrome.
- Form start points and section hierarchy are harder to parse on mobile.

Recommendation:

- Either switch the mobile nav to a true bottom safe-area dock with more reserved space, reduce its height, or move the most important first-viewport content higher so nothing meaningful sits behind it.

### 3. Mobile header collapses awkwardly and weakens the first impression

Severity: High

Observed visually:

- Brand subtitle wraps into a tall block.
- `Log in` breaks into two lines.
- The primary header CTA reads like an empty outlined box.
- The header consumes too much height before the page content begins.

Likely cause:

- `src/components/layout/top-nav.tsx`

The desktop header structure is being squeezed into a small width without enough mobile-specific simplification.

Impact:

- The app looks less premium on mobile than on desktop.
- Navigation clarity drops before the user even reaches content.

Recommendation:

- On mobile, collapse the subtitle, shorten or hide secondary header actions, and reduce the header to a single-row system with one clear primary action.

### 4. Missing-data and missing-route states are under-designed

Severity: Medium

Observed visually:

- `/` with no experiences has a large empty hero and the meaningful empty-state message appears much lower on the page.
- `/experiences/[id]` falls back to the plain Next.js `404` with no HostBid branding or recovery path.

Impact:

- Early environments feel unfinished.
- The app loses its voice exactly when data is absent or a link is broken.

Recommendation:

- Design a branded empty discovery state near the top of the page.
- Add a custom `not-found` page that matches the HostBid visual system and routes people back to discovery or account setup.

## Route-by-Route Notes

### `/`

What works:

- Good typography scale and calm visual direction.
- Card styling and shadows feel coherent.
- The two-column desktop composition is strong.

What needs work:

- Primary CTA is visually broken.
- The hero card is too tall when there are no experiences.
- The meaningful empty-state message is disconnected from the top of the page.
- Mobile bottom nav intrudes into the first reading flow.

### `/login`

What works:

- Best-composed desktop page in the app right now.
- The left marketing column and right form card balance well.
- Form spacing is clear and premium-looking.

What needs work:

- Primary submit button lacks visible fill.
- Mobile puts too much marketing above the actual form.
- Bottom nav overlaps the transition into the form card on mobile.

### `/signup`

What works:

- Strong desktop composition similar to login.
- Good hierarchy between promise, proof cards, and form.

What needs work:

- Same broken primary button fill.
- The page is visually very similar to login; the distinction is mostly copy, not layout.
- On smaller screens, the form should arrive earlier.

### `/dashboard`, `/experiences/new`, `/profile`, `/messages`, `/messages/[threadId]`, `/moderation`

Observed state in this environment:

- All redirect to the login page when signed out.

Audit note:

- The redirect behavior appears consistent.
- From a product perspective, this means most of the app currently shares the same signed-out visual state.
- Once seeded auth data is available, these pages need a second audit pass because they were not viewable in their true product state here.

### `/experiences/[id]`

Observed state in this environment:

- Plain Next.js `404`.

Audit note:

- Functionally acceptable for now.
- Visually inconsistent with the rest of the product and missing any brand recovery path.

## Patterns Worth Keeping

- Typography hierarchy is strong across major marketing surfaces.
- The white-card-on-soft-atmospheric-background direction fits the product positioning.
- Badge styling is mostly tasteful and restrained.
- The auth page card/form system is a solid foundation.

## Recommended Next Pass

1. Fix gradient fills for brand badge and all primary buttons.
2. Redesign the mobile header and bottom nav together as a single mobile shell problem.
3. Pull the homepage empty state much higher when there is no discovery content.
4. Add branded empty, loading, and not-found states.
5. Re-run a second visual audit once seeded data and a signed-in test account are available.

## Logged-In Audit Addendum

Date: 2026-04-22
Capture set: `tmp/ui-logged-in-full/*.png`
Auth state: real Supabase user session routed through a local authenticated proxy

This pass was done on the real logged-in shell, not mock data. The authenticated app renders reliably, but most interior routes are still visually dominated by missing or absent backend records. That means the main signed-in design question is no longer "does the shell work?" but "do empty and edge states feel intentional enough to ship?"

### Logged-In Executive Summary

What is working:

- The signed-in global shell now feels coherent on desktop.
- The homepage remains the strongest overview screen even with no live experiences.
- `/experiences/new` is the most complete product page and feels closest to production quality.
- The branded `not-found` experience is strong and matches the product voice.

What still feels unfinished:

1. Several logged-in routes collapse into a single lonely card with a large field of empty page background.
2. The mobile fixed bottom nav still overlaps form fields and lower-page actions.
3. Default or missing account data makes profile surfaces feel placeholder-heavy instead of intentionally incomplete.
4. Real detail routes currently resolve to `404`, so important "open thread" and "view experience" destinations are not yet represented by a complete product state.

### Highest-Priority Logged-In Findings

#### 1. Empty logged-in pages feel structurally unfinished rather than intentionally empty

Severity: High

Observed visually:

- `/dashboard` shows two well-styled cards, but both are mostly empty and the rest of the page becomes a large vacant gradient field.
- `/messages` renders a single empty-state card near the top and then drops into a large unused canvas.
- `/moderation` has the same problem with only "No active reports." in a very large shell.

Impact:

- The app looks underbuilt even when it is functioning correctly.
- Logged-in users do not get enough guidance or secondary actions when there is no data.
- The contrast between polished cards and huge blank page areas makes the product feel incomplete.

Recommendation:

- Turn these into fully designed empty states with stronger secondary copy, illustration or diagram support, and route-specific next actions.
- Add companion modules below the first card on sparse pages so the viewport feels intentionally composed even without records.

#### 2. Mobile bottom navigation still collides with live form and content areas

Severity: High

Observed visually:

- On `/profile`, the fixed nav cuts directly across the middle of the long form and preview region.
- On `/experiences/new`, the nav overlays input controls around the date and pricing section.
- On `/404`, the nav intrudes on the transition between the hero card and the recovery-path card.

Impact:

- Long-form creation flows feel obstructed.
- Users can mistake partially hidden fields for broken spacing.
- The app loses the premium calm of the desktop layout on mobile.

Recommendation:

- Either reserve more bottom padding throughout long-form screens, reduce the dock footprint, or convert the mobile nav into a true safe-area toolbar that never visually sits on top of active content.

#### 3. Profile quality and identity states expose raw missing data too literally

Severity: Medium

Observed visually:

- `/profile` renders "Your name", missing location, missing age, and a `Profile 20` chip.
- The header account pill uses the email address because there is no actual profile identity to display.
- The page is visually polished, but the content language still reads like scaffolding.

Impact:

- Users are reminded of database absence rather than guided into profile completion.
- Trust-oriented surfaces lose credibility when their own labels feel like placeholders.

Recommendation:

- Replace literal fallback strings with guided incomplete-profile language.
- Consider a more explicit completion state, such as "Profile just started" or "Add your first details," instead of numeric-looking fallback chips.

#### 4. Key detail routes currently terminate in `404`

Severity: Medium

Observed visually:

- `/messages/77777777-7777-4777-8777-777777777777` returns `404`.
- `/experiences/44444444-4444-4444-8444-444444444444` returns `404`.
- The branded `404` itself is strong, but it is currently representing routes that should eventually be central product states.

Impact:

- The audit cannot yet validate conversation-detail or experience-detail layouts in a real logged-in state.
- Important user journeys currently dead-end before the product can demonstrate depth.

Recommendation:

- Seed or implement these routes next; they are central to the signed-in experience and should be reviewed again as soon as real records exist.

### Logged-In Route Notes

#### `/`

What works:

- Still the best-composed page in the app.
- The signed-in shell, hero, supporting value cards, and empty discovery guidance now work well together.
- The "first experience" empty state is much better placed than it was before.

What needs work:

- Mobile still suffers from bottom-nav overlap between sections.

#### `/dashboard`

What works:

- The two-card structure is clean and readable.
- The page has a clear split between hosting and offer activity.

What needs work:

- It is too sparse to feel complete.
- The empty boxes need richer next-step guidance and more supporting structure below the fold.
- On mobile, the "New experience" CTA crowds the heading and wraps awkwardly.

#### `/profile`

What works:

- Good two-column desktop composition.
- The form and profile-preview relationship is easy to understand.

What needs work:

- Missing data reads as placeholder product copy rather than purposeful onboarding.
- Mobile is especially crowded because the fixed nav cuts across the lower portion of the form.

#### `/messages`

What works:

- The page title and shell are clear.

What needs work:

- It is currently just a single empty message card floating in a large blank page.
- This route needs more narrative help around how conversations unlock and what to do next.

#### `/moderation`

What works:

- The safety framing is clear and consistent with the product tone.

What needs work:

- The page is visually too empty to feel like a real moderation workspace.
- It needs a richer no-reports state or adjacent guidance modules.

#### `/experiences/new`

What works:

- Strongest interior page in the product.
- Good split between editorial framing and structured inputs.
- Safety settings feel integrated instead of bolted on.

What needs work:

- Mobile bottom-nav overlap interferes with several mid-page fields.
- Placeholder-heavy inputs still make the page feel seeded rather than ready.

#### `/messages/[threadId]`

Observed state:

- `404`

Audit note:

- The branded fallback is good, but the real conversation detail page still needs to exist before the logged-in app can be considered fully audited.

#### `/experiences/[id]`

Observed state:

- `404`

Audit note:

- Same conclusion as messages detail: graceful failure exists, but the product-critical detail state is still missing from this audit because the route has no live record to render.

#### `not-found`

What works:

- Strong branded recovery language.
- The recovery options are clear and useful.
- Works well on both desktop and mobile.

What needs work:

- On mobile, the fixed bottom nav overlaps the lower card transition.

### Logged-In Screens Worth Keeping

- The signed-in desktop header and account pill are substantially more grounded than before.
- The homepage empty-state composition now feels like a real product landing state.
- The new-experience form is a strong foundation for the rest of the app.
- The branded `404` page is one of the clearest recovery surfaces in the product.

### Logged-In Completion Risks

1. The app can now be authenticated, but it still lacks enough real seeded records for the most important interior views to prove themselves visually.
2. Empty-state design quality is now the main determinant of whether the logged-in product feels finished.
3. Mobile shell behavior remains the biggest cross-route UX issue in the authenticated experience.
