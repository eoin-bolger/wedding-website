# Wedding Website — Claude Code Handoff

_Complete build specification. Read this entire document before writing a single line of code._

---

## Project Overview

A wedding website for Ashley & Eoin. Wedding weekend: August 20–22, 2026 at Ballintubbert Gardens & House, County Laois, Ireland.

**Dual audience:** Wedding guests (need practical info quickly) and the design community (will scrutinise the craft). Both must be served simultaneously — clarity and beauty are not in conflict here.

**Tone:** Warm, elegant, celebratory. Luxury without stiffness. Personal without being sentimental.

**Figma file:** https://www.figma.com/design/kIKuhF22Ps7wEhiHzj524K/Wedding-website?node-id=14327-259

---

## Tech Stack

- **Framework:** Plain HTML, CSS, JavaScript — no framework
- **Animation:** GSAP + ScrollTrigger for all scroll-based animations. CSS only for micro-interactions.
- **Fonts:** TheSecretLibrary, Lancelot, Recoleta, Cormorant SC — all loaded via @font-face
- **Images:** WebP or AVIF, lazy-loaded below fold, always explicit width/height

---

## Design Tokens

### Colours

```css
--color-green-dark: #43461f; /* Primary dark. Text, dark sections */
--color-green-mid: #969d5c; /* Mid green accent */
--color-sand: #b8a36a; /* Sand accent */
--color-cream: #efe6d3; /* Text on dark backgrounds */
--color-bg-default: #eeeade; /* Default section background */
--color-bg-hero: #ceccaa; /* Hero + FAQ background */
--color-blue-dust: #d6dee2; /* Wedding Day order-of-events only */
```

### Typography

```css
/* Heading 1 — TheSecretLibrary. Emotional headings, names, big moments */
--font-h1: "TheSecretLibrary", serif;
--size-h1: 72px;
--leading-h1: 1.1; /* Never use 'normal' — define it explicitly */

/* Heading 2 — TheSecretLibrary. Section headings */
--font-h2: "TheSecretLibrary", serif;
--size-h2: 64px;
--leading-h2: 1.6;

/* Heading 3 — Recoleta Regular. Dates, overlines, structural labels */
--font-h3: "Recoleta", serif;
--size-h3: 40px;
--leading-h3: 1;

/* Heading 4 — Recoleta SemiBold. Sub-labels, overlines */
--font-h4: "Recoleta", serif;
--font-h4-weight: 600;
--size-h4: 24px;
--leading-h4: 1.5;

/* Body Normal — Lancelot. All paragraph text */
--font-body: "Lancelot", serif;
--size-body: 24px;
--leading-body: 1.6; /* Figma shows 1.2 — override to 1.6 everywhere */

/* Body Small — Lancelot. Captions, fine print */
--size-body-sm: 18px;

/* Hero flanking text — Cormorant SC SemiBold */
--font-flanking: "Cormorant SC", serif;
--size-flanking: 32px; /* Reduced from Figma's 40px — less competition with oval */
```

### Spacing

```css
--page-padding: 64px; /* Global horizontal padding */
--padding-sm: 16px;
--max-width-xl: 1280px;
--max-width-lg: 768px;
--max-width-md: 560px;
```

### Animation Defaults

```css
/* Default entrance easing — fast in, slow luxurious settle */
--ease-entrance: cubic-bezier(0.16, 1, 0.3, 1);

/* Envelope flap easing — slow and deliberate */
--ease-deliberate: cubic-bezier(0.25, 0.46, 0.45, 0.94);

/* Wax seal snap — the one place overshoot is used */
--ease-snap: cubic-bezier(0.34, 1.56, 0.64, 1);
```

---

## Global Rules — Read Before Every Component

1. **Never use `transition: all`** — always specify the exact property
2. **Never use `ease-in` for entrances** — elements feel like they slam in
3. **`prefers-reduced-motion` must be respected** — every animation needs a no-motion fallback
4. **No simultaneous animation chaos** — elements animate in sequence, staggered
5. **Images always have explicit `width` and `height`** — no layout shift (CLS < 0.1)
6. **Body text `line-height: 1.6` everywhere** — Figma's 1.2 is too tight, override it
7. **Semantic HTML first** — never use a `div` when `section`, `article`, `nav`, `button` will do
8. **GSAP for scroll animations, CSS for micro-interactions** — don't mix this up

---

## Page Architecture

Build sections in this exact order:

1. Hero
2. "Our forever begins in Ireland…" (intro)
3. Our Story (the two letters) — ⚠️ DEFERRED — placeholder only for now, full animation built separately later
4. Proposal photo (full bleed, no text)
5. Welcome to Dublin (Wednesday)
6. The Night Before at The Fisherman's (Thursday)
7. Our Wedding Day (Friday) — The Venue is embedded at the base of this section, not a standalone section
8. Day Two Celebration (Saturday)
9. How to Get There
10. Where to Stay
11. Common Questions (accordion)
12. Gifts
13. Countdown
14. Nav (fixed, bottom-left, persistent)

---

## Section Specifications

---

### Section 1 — Hero

**Background:** `#ceccaa`
**Height:** `100vh` — fixed, never more

**Layout:**
Three elements horizontally centred across the full width:

- Left: "BALLINTUBBERT / GARDENS & HOUSE" — Cormorant SC, 32px, `#43461f`, uppercase, `text-align: center`, `flex: 1`
- Centre: Oval portrait frame component (see below)
- Right: "WEDDING WEEKEND / AUG 20–22, 2026" — Cormorant SC, 32px, `#43461f`, uppercase, `text-align: center`, `flex: 1`

**Oval frame component:**
Four layered oval SVGs (trim, outer, middle, inner) stacked via CSS Grid `place-items: start`. The photo sits inside the innermost oval. "Ashley & Eoin" in TheSecretLibrary 72px cream sits over the photo, centred.

**Page load animation sequence — implement exactly:**

1. Oval starts at 80–90vh height, centred. All other elements hidden (`opacity: 0`).
2. Images cycle inside oval — 4–5 burst shots from Barcelona running sequence. Hard cuts, no crossfade, 150–200ms per frame. Use `setInterval` to cycle `src` or swap CSS `background-image`.
3. After final frame: 500ms pause (stillness).
4. Oval scales down to final design size — GSAP `to({ scale: finalScale })`, 700ms, `ease: "power3.out"`.
5. "Ashley & Eoin" text fades in — `opacity: 0 → 1`, 400ms, starts when oval scale completes.
6. Left flanking text fades in — 300ms, `ease: "power2.out"`.
7. Right flanking text fades in — 300ms, `ease: "power2.out"`, 120ms after left.

**Fallback (if burst shots aren't available):** Single static image in oval. All elements fade in sequentially with 150ms stagger.

**`prefers-reduced-motion` fallback:** Skip cycling and scaling. All elements appear at final state, simple `opacity` fade over 400ms.

---

### Section 2 — "Our forever begins in Ireland…"

**Background:** `#efe6d3` — light cream, no photograph
**Height:** auto

**Layout:** Left-aligned text block. Max-width 600px.

- "Our forever begins in Ireland…" — TheSecretLibrary, 80px, `#43461f`, `line-height: 1.1`
- Invitation copy — Lancelot, 20px, `#43461f`, `line-height: 1.6`, below heading
- Grá Mór illustration — positioned top-right, `position: absolute`, no text competition

**Scroll entrance:**

- Heading: `clip-path: inset(100% 0 0 0) → inset(0% 0 0 0)`, 800ms, `--ease-entrance`
- Body copy: `opacity: 0 → 1` + `translateY(16px) → translateY(0)`, 600ms, starts 300ms after heading completes

---

### Section 3 — Our Story ⚠️ DEFERRED

**Status:** Build as a static placeholder now. The envelope animation is being designed and prototyped separately and will be integrated later.

**Placeholder build:**

- Full bleed oil painting floral background — `object-fit: cover`
- "Our Story" heading in TheSecretLibrary, large, cream, top-left
- Two static letter/card components side by side — no animation, just the visual layout with the stamp clusters in position
- Ashley's letter left (-8deg rotation), Eoin's letter right (+8deg rotation)
- Letters appear open showing their text content — no envelope mechanic yet

**⚠️ Do not attempt the envelope flap or paper rise animation in this build phase.**
The full animation spec is documented below for future reference only.

**Future animation spec (implement later, in isolation):**

- Trigger: IntersectionObserver at 30% section visibility
- Both envelopes visible, still — 400ms pause
- Ashley's envelope flap: `rotateX(0deg) → rotateX(-180deg)`, `transform-origin: top center`, 900ms, `--ease-deliberate`, `perspective: 1000px` on parent
- 300ms pause after flap open
- Letter paper rises: `translateY(100%) → translateY(-30%)`, 1000ms, `--ease-deliberate`
- Letter text fades in: `opacity: 0 → 1`, starts 400ms into paper rise, 600ms duration
- Eoin's envelope starts 300ms after Ashley's
- Stamp clusters float loop: `translateY(0px) → translateY(-4px) → translateY(0px)`, 3s, `ease-in-out`, staggered delays

---

### Section 4 — Proposal Photo

**Height:** `100vh`
**Content:** Zero. No text, no UI, no overlay.
**Image:** The Muckross House proposal photo. `object-fit: cover`, `object-position: center`.

**Scroll animation:**
GSAP ScrollTrigger scrub parallax. Image moves at 60% of scroll speed.

```javascript
gsap.to(proposalImg, {
  yPercent: -20,
  ease: "none",
  scrollTrigger: {
    trigger: section,
    start: "top bottom",
    end: "bottom top",
    scrub: true,
  },
});
```

Nothing else. Trust the photo.

---

### Section 5 — Welcome to Dublin

**Date:** Wednesday, August 19th
**Background:** `#efe6d3`
**Height:** auto, padding `180px` top/bottom

**Layout:**

- "Welcome to Dublin" — TheSecretLibrary 72px `#43461f`, top-left
- "WEDNESDAY, AUGUST 19TH" — Recoleta 40px, top-right
- "ATTENDANCE OPTIONAL" badge — bordered rectangle, Recoleta SemiBold 24px, below date
- Two-column content below: left (description, who's invited), right (time/schedule, location)

**Image strip below section:**
4 equal-width image slots separated by `2px #efe6d3` borders. `overflow: hidden`, `object-fit: cover`, `height: 280px`.

**Scroll entrance:**

- Heading clips up: `clip-path: inset(100% 0 0 0) → inset(0%)`, 700ms, `--ease-entrance`
- Date + badge fade in: 400ms, 150ms after heading
- Content columns fade up: `opacity 0→1` + `translateY(24px)→0`, 600ms, 200ms stagger

---

### Section 6 — The Night Before at The Fisherman's

**Date:** Thursday, August 20th
**Background:** `#efe6d3`

Same layout template as Welcome to Dublin. Heading: "The Night Before" in TheSecretLibrary 72px. No photograph. Same scroll entrance.

**4-image strip below:** Same treatment as Dublin.

---

### Section 7 — Our Wedding Day

**Date:** Friday, August 21st
**Background:** `#43461f` dark green
**Height:** minimum 130vh

**Structure top to bottom:**

1. "FRIDAY, AUGUST 21ST" — Recoleta 32px, cream, uppercase, centred
2. "Our Wedding Day" — TheSecretLibrary 80px, cream, centred
3. Three-column: venue intro text left ("THE HEART OF OUR STORY UNFOLDS HERE") | Ballintubbert fountain photo centre | attire copy right
4. Cream 1px divider
5. "ATTIRE — FORMAL GARDEN ELEGANCE" + copy, centred, cream
6. Cream 1px divider
7. Timeline on cream panel — zigzag, left/right alternating events

**Timeline:** Vertical cream 1px spine. Events alternate sides (zigzag). Each event has a thumbnail photo on the alternating side — Ballintubbert house (Arrival), wedding rings (Ceremony), dinner setting (Feast), disco ball (Party).
Order: Arrival 1:15pm → Ceremony 2:00pm → Toast 2:45pm → Feast 6:00pm → Party 9:00pm → Goodbyes 1:30am
Labels: TheSecretLibrary 40px dark green. Times: Recoleta 32px dark green.

**Scroll animations:**

1. Section wipe: `clip-path: inset(0 0 100% 0) → inset(0 0 0% 0)`, 1000ms
2. 400ms pause
3. Heading letter-by-letter stagger: GSAP SplitText or manual spans, 40ms between characters
4. Content fades up 600ms after heading
5. Timeline spine: `scaleY(0) → scaleY(1)`, `transform-origin: top`, 1000ms
6. Event points fade in sequentially, 150ms stagger

**Below timeline:** Full-bleed Ballintubbert reflecting pool photo, `height: 60vh`. Venue copy on dark green below.

**The Venue sub-section** (bottom of this dark green section, after the reflecting pool photo):

- "THE VENUE" — Recoleta overline, cream
- "Ballintubbert Gardens & House" — TheSecretLibrary 54px, cream
- Copy — Lancelot 20px, cream, `line-height: 1.6`
- Location link — Lancelot, cream, underline on hover
- Give this `id="the-venue"` for nav anchor linking

**Scroll animation (The Venue):** Text fades up on enter.

---

### Section 8 — Day Two Celebration

**Date:** Saturday, August 22nd
**Background:** `#efe6d3`

Same layout template as Dublin/Night Before. Heading: "Day Two Celebration" TheSecretLibrary 72px.

**Scroll entrance:** Simple fade up together — `opacity 0→1` + `translateY(20px)→0`, 600ms.

---

### Section 9 — How to Get There

**Background:** `#eeeade`
**Layout:** Split — left: heading + directions. Right: two polaroid photos + Ireland map illustration.

**Polaroid:** Cream rectangle, slight rotation, photo inside, white border, `box-shadow: 0 4px 16px rgba(67,70,31,0.12)`.

**Ireland map:** PNG/SVG of Ireland. Location pin at County Laois. "We're here" in Lancelot 14px.

**Scroll entrance:**

- Heading clips up, 600ms
- Text fades up 150ms after
- Polaroids slide from right, 200ms stagger: `translateX(40px)→0` + `opacity 0→1`
- Map fades in last, 400ms

---

### Section 10 — Where to Stay

**Background:** `#eeeade`

**Pull quote:** TheSecretLibrary 48px, centred, `#43461f`:
_"We recommend staying nearby and sharing taxis — the countryside deserves to be enjoyed."_

**Tables:** Two columns — Near the Venue | Dublin City Break.
Header row: Recoleta uppercase, `border-bottom: 1px solid rgba(67,70,31,0.2)`.
Row hover: `background-color: rgba(67,70,31,0.04)`, 150ms.
Accommodation names = `<a>` links, `target="_blank"`.

**Scroll entrance:** Pull quote clips up 700ms. Columns fade up 200ms stagger.

---

### Section 11 — Common Questions

**Background:** `#ceccaa`
**Layout:** Two-column — "Common / Questions" TheSecretLibrary 72px left. Accordion right.

**Accordion:**

- Question: Recoleta uppercase 20px
- Answer: Lancelot 20px, `line-height: 1.6`
- Separator: `#43461f` at 20% opacity, 1px
- Expand indicator: wax seal SVG — sealed/broken states, 300ms `--ease-snap`
- Answer reveal: `max-height: 0 → max-height`, 400ms — never animate `height` directly

**Scroll entrance:** Heading fades from left. Questions stagger: `translateY(20px)→0` + `opacity 0→1`, 80ms stagger.

---

### Section 12 — Gifts

**Background:** `#eeeade`

**Intro:** TheSecretLibrary 48px, centred, `#43461f`.

**Three cards:**

- Background `#f5f0e8`, shadow `0 4px 24px rgba(67,70,31,0.08)`
- Rotations: -2deg, 0deg, +2deg
- Contents: QR code centred, payment method Recoleta 32px, details Lancelot 16px

**Scroll entrance:** Cards fan from centre — start stacked at 0deg/opacity 0, fan to final rotation + opacity 1, 150ms stagger.

---

### Section 13 — Countdown

**Background:** Floral painting image, full bleed

**Numbers:** TheSecretLibrary 180px, `#43461f`
**Labels:** Recoleta 100px, `#43461f`, spaced full width

**Live countdown:** JS countdown to `2026-08-21T14:00:00` in `Europe/Dublin` timezone. Updates every second.

**Digit flip:** Outgoing `translateY(-100%) + opacity 0`, incoming `translateY(100%)→0 + opacity 0→1`, 200ms crossfade.

**Colon pulse:** `opacity 1→0.3→1`, 1s loop.

**Background zoom:** `scale(1.0)→scale(1.06)`, 20s alternating loop.

**Scroll entrance:** Digits count up rapidly from 0 to real value on section enter, then live countdown takes over.

---

### Section 14 — Nav (The Paper Note)

**Position:** `position: fixed`, bottom-left, `z-index: 9999`

**Resting state:** ~60×60px folded cream paper corner. "Menu" in Lancelot 12px.

**Open state:** Unfurls to ~220×280px, `clip-path` reveal, 400ms, `--ease-entrance`.

- Background: `#efe6d3` with paper texture
- Ruled lines: CSS `repeating-linear-gradient`
- Links: TheSecretLibrary 18px, `#43461f`
- Active link: small `#43461f` filled circle, 6px

**Link hover:** `::after` underline, `scaleX(0)→scaleX(1)`, `transform-origin: left`, 200ms.

**Close:** Click/tap outside. Same animation reversed.

**Mobile:** Tap to open, tap outside to close.

**Links:** Hero, Our Story, Welcome to Dublin, The Night Before, Our Wedding Day, Day Two, The Venue, Getting There, Where to Stay, Questions, Gifts

---

## Assets Checklist

- [ ] Barcelona photoshoot burst sequence (4–5 running shots for hero)
- [ ] Best Barcelona portrait (for image strips)
- [ ] Ashley's letter text (her perspective)
- [ ] Eoin's letter text (his perspective)
- [ ] Proposal photo — Muckross House (in Figma)
- [ ] Ballintubbert reflecting pool photo (in Figma)
- [ ] All stamp illustrations (in Figma — America, Florida, Cherub, Hurler, Éire)
- [ ] Grá Mór illustration (in Figma)
- [ ] Irish map illustration (in Figma)
- [ ] Wax seal SVG for accordion (needs creating)
- [ ] QR codes for Revolut, Zelle, Cash
- [ ] Floral painting for countdown background (in Figma)
- [ ] Barcelona photos for image strips (4 per section strip)

---

## Build Order

1. **Global CSS** — tokens, typography, reset, page shell
2. **Nav** — build early, use throughout development
3. **Hero** — sets the visual language
4. **Countdown** — self-contained, good for testing GSAP patterns
5. **Event sections** — Dublin, Night Before, Wedding Day, Day Two (shared template, build one then replicate)
6. **Remaining sections** — Getting There, Where to Stay, FAQ, Gifts
7. **"Our forever begins in Ireland…"** — needs Barcelona photo
8. **Proposal photo parallax** — add after GSAP is already set up
9. **Our Story placeholder** — static layout, letters visible, no animation
10. **All scroll entrance animations** — add last, once all structure is solid
11. **Our Story envelope animation** — separate session, built in isolation, integrated when complete

---

## Responsive / Mobile

Two breakpoints only. Desktop-first.

```css
/* Tablet — two-column layouts start collapsing */
@media (max-width: 1024px) {
}

/* Mobile — everything single column */
@media (max-width: 640px) {
}
```

### Per-section mobile behaviour

| Section                  | Desktop                          | ≤1024px                                      | ≤640px                               |
| ------------------------ | -------------------------------- | -------------------------------------------- | ------------------------------------ |
| Hero                     | Left text \| Oval \| Right text  | Flanking text moves above/below oval         | Same                                 |
| Section 2                | Text left, Grá Mór right         | Stack: text above, illustration below        | Same                                 |
| Event sections (5, 6, 8) | 2-column                         | Single column                                | Single column                        |
| Wedding Day 3-col        | 3 columns                        | 2-col                                        | Single column                        |
| Timeline                 | Zigzag, alternating              | Collapse to single column, images above text | Same                                 |
| How to Get There         | 2-col (text + polaroids/map)     | Single column                                | Single column                        |
| Where to Stay            | 2 tables side by side            | Stacked                                      | Stacked, horizontal scroll if needed |
| Common Questions         | 2-col (heading + accordion)      | Single column                                | Single column                        |
| Gifts                    | 3 cards fanned (-2deg, 0, +2deg) | 3 cards stacked, no rotation                 | Same                                 |
| Countdown                | Large numbers row                | Same layout, numbers scale down              | Same                                 |
| Nav                      | Fixed paper note, bottom-left    | Same                                         | Tap to open/close                    |

### Typography scale (mobile ≤640px)

Scale headings down proportionally — do not let them overflow the viewport.

```css
/* Suggested mobile overrides */
--size-h1: 48px; /* was 72px */
--size-h2: 40px; /* was 64px */
--size-h3: 28px; /* was 40px */
--size-body: 18px; /* was 24px */
--page-padding: 24px; /* was 64px */
```

---

## Animation Reference

```javascript
// Default scroll entrance
gsap.from(el, {
  opacity: 0,
  y: 24,
  duration: 0.6,
  ease: "power3.out",
  scrollTrigger: { trigger: el, start: "top 85%" },
});

// Clip-path heading reveal
gsap.from(el, {
  clipPath: "inset(100% 0 0 0)",
  duration: 0.8,
  ease: "power3.out",
  scrollTrigger: { trigger: el, start: "top 85%" },
});

// Timeline spine draw
gsap.from(spine, {
  scaleY: 0,
  transformOrigin: "top center",
  duration: 1,
  ease: "power3.out",
  scrollTrigger: { trigger: timelineSection, start: "top 60%" },
});

// prefers-reduced-motion — always wrap animations in this check
const prefersReduced = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;
if (!prefersReduced) {
  // all GSAP animations here
}
```

---

## The Standard to Hold Every Decision To

_"Does this just inform, or does it make the guest feel something?"_

Every section should clear that bar.
