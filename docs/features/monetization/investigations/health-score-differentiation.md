# Investigation: Health Score as Core Differentiator

**Feature**: monetization
**Status**: In Progress
**Created**: 2026-03-09

## Approach

MacroLog already computes a three-axis health breakdown for every food item — `nutrientDensity`,
`processingLevel`, and `goalAlignment` — plus a `healthReason` text. None of this is currently
shown in the UI beyond a tiny numeric badge. The competitive moat is already built; it just isn't
visible.

This investigation defines how to surface, explain, and weaponize the health score as the primary
reason users choose MacroLog over Cal AI, MyFitnessPal, or MacroFactor.

---

## Current State: Buried Data

### What's computed (already in model, per `FoodItem`):

```ts
healthScore: number                   // 0–100 composite
healthBreakdown: {
  nutrientDensity: number;            // vitamins, minerals, fiber
  processingLevel: number;            // whole foods (high) vs ultra-processed (low)
  goalAlignment: number;              // fit to user's cal/protein/carb/fat targets
}
healthReason: string                  // 1-sentence AI explanation of scores
encouragement: string                 // 1–2 sentence coaching message
```

### Where it's currently shown:

| Location | What's shown | What's missing |
|---|---|---|
| `Home.tsx` meal row | Colored badge: icon + "Good" label | Score number, breakdown, reason |
| `MealReviewModal.tsx` summary | Score number + rating label | **Breakdown bars/chart, reason text** |
| `MealReviewModal.tsx` per-item | Score badge (number + icon) | Breakdown, reason |
| `Progress.tsx` | Nothing | All of it |
| Home header | Nothing | Daily avg score |

The `healthBreakdown` object and `healthReason` are **never rendered anywhere**. The `encouragement`
text is shown per food item in edit mode only — invisible in the summary view.

---

## What to Build

### 1. Health Breakdown Panel (MealReviewModal — high impact, low effort)

Replace the single score badge in the meal summary with a three-bar breakdown panel.

**Proposed layout:**
```
┌─────────────────────────────────────────────────────┐
│  Health Score                                87/100  │
│  Excellent                                          │
│                                                      │
│  Nutrient Density   ████████████████░░   84          │
│  Processing Level   ██████████████████   91          │
│  Goal Alignment     ██████████░░░░░░░░   68          │
│                                                      │
│  "High in fiber and lean protein; carbs slightly    │
│   above your daily target."                         │
└─────────────────────────────────────────────────────┘
```

- Three labeled progress bars, each 0–100, colored by their individual value
- `healthReason` displayed as a caption beneath the bars
- Expandable per-item: tap any food item card → shows its own breakdown inline
- No new AI calls, no new data — purely a UI change

**Files to change:** `MealReviewModal.tsx`, `MealReviewModal.css`
**Effort:** ~2–3 hours

---

### 2. Daily Health Score on Home Screen (medium impact, low effort)

Add a secondary ring or score pill to the home activity card showing today's average health score
alongside the calorie ring.

**Options:**
- **A (minimal):** Score pill beneath the calorie ring: `Today's Health Score: 82 · Good`
- **B (richer):** Second small ring (nested or side-by-side) using the health score as the fill value
  and a color gradient from red→amber→green

Option A is ~1 hour. Option B is ~3 hours and looks distinctly premium.

The score updates live as meals are logged. First meal of the day → score appears. No meals → hidden.

**Files to change:** `Home.tsx`, `Home.css`
**Effort:** 1–3 hours

---

### 3. Shareable Meal Score Card (high impact, medium effort — viral loop)

After saving a meal, show a "Share" button that generates a PNG card via HTML Canvas and sends it
to the iOS Share Sheet (`Capacitor Share` plugin).

**Card design (portrait, ~390×540 px):**
```
┌──────────────────────────────┐
│  [Meal photo, cropped]       │
│                              │
│  MacroLog           🌿 87   │
│  ─────────────────────────  │
│  Nutrient Density    ████ 84 │
│  Processing Level    ████ 91 │
│  Goal Alignment      ███  68 │
│  ─────────────────────────  │
│  512 cal  · 38g protein      │
│  52g carbs · 18g fat         │
│  ─────────────────────────  │
│  Logged with MacroLog        │
└──────────────────────────────┘
```

- Rendered off-screen as a `<canvas>` element → `toDataURL('image/png')`
- `@capacitor/share` → `Share.share({ files: [tempPng], title: 'My meal score' })`
- User shares to Instagram Stories, iMessage, etc. — app watermark visible on every share
- **Each share is a free user acquisition ad**

Spotify Wrapped generated 2.1M social mentions in 48h with this exact mechanic. Even 0.1% of that
would be transformative for a bootstrapped app.

**Files to change:** new `ShareCard.tsx` component, `MealReviewModal.tsx` (add Share button)
**Effort:** ~6–8 hours
**Dependency:** `@capacitor/share` (already in Capacitor ecosystem, no extra cost)

---

### 4. Weekly "MacroLog Wrapped" Summary Card (medium impact, medium effort)

A weekly share card available every Sunday (or any time from Progress tab) summarizing the week:

```
┌──────────────────────────────┐
│  Your Week in MacroLog       │
│  Mar 3–9, 2026               │
│  ─────────────────────────  │
│  🌿 Avg Health Score   79   │
│  🔥 Streak              6   │
│  📸 Meals Logged        18  │
│  ─────────────────────────  │
│  Best Meal · Thu Dinner      │
│  [thumbnail]    Score: 94   │
│  ─────────────────────────  │
│  Logged with MacroLog        │
└──────────────────────────────┘
```

Same canvas → share sheet approach. Surfaced in the Progress tab as "Share this week".

**Effort:** ~4–6 hours (reuse ShareCard canvas infra from item 3)

---

### 5. Score Explanation Sheet (low effort, high trust-building)

First time a user sees the health score (or on tap of the score), show a bottom sheet explaining
the three dimensions:

```
What's my Health Score?

Your score (0–100) combines three things:

🥦 Nutrient Density (33%)
   How rich in vitamins, minerals, and fiber this meal is.

🌾 Processing Level (33%)
   Whole foods score high. Ultra-processed foods score low.

🎯 Goal Alignment (34%)
   How well this meal fits your personal calorie and macro targets.
```

- Bottom sheet modal, shown once on first score view (stored in Preferences)
- No ongoing cost, no API calls
- Converts a "what does 74 mean?" moment into a "this app actually understands nutrition" moment

**Effort:** ~2 hours

---

## Competitive Analysis: Why This Wins

| App | Photo → macros | Health quality score | Score breakdown | Personalized to user goals | Shareable score card |
|---|---|---|---|---|---|
| **MacroLog** (today) | ✓ | ✓ (hidden) | ✓ (hidden) | ✓ (hidden) | ✗ |
| **MacroLog** (proposed) | ✓ | ✓ **prominent** | ✓ **shown** | ✓ **shown** | ✓ **shareable** |
| Cal AI / MFP | ✓ | ✗ | ✗ | ✗ | ✗ |
| MacroFactor | ✓ (paid) | ✗ | ✗ | ✓ (adaptive algorithm) | ✗ |
| MealScore | ✓ | ✓ (9 generic axes) | ✓ | ✗ (not goal-linked) | ✗ |
| Yuka | ✗ (barcode only) | ✓ | ✓ | ✗ | ✗ |

**Key insight on MealScore:** It has 9 health dimensions (gut, skin, sleep, muscle, etc.) but they
are **not personalized** — every user gets the same score for the same food. MacroLog's
`goalAlignment` axis makes the score unique to each user. A 400-cal salmon bowl scores differently
for a 160g-protein athlete vs a 1,400-cal deficit cutter. That's meaningfully harder to copy.

**Key insight on Yuka:** 60 million users, built on barcodes, scores packaged food. MacroLog does
this for **cooked and restaurant meals from photos** — no barcode, no database. That's a genuinely
different problem.

---

## Positioning Statement

> "MacroLog doesn't just count your calories — it scores your food's health quality, broken down
> into how nutritious it is, how processed it is, and how well it fits *your* goals. No other app
> gives you a score that's personal to you."

This should be the App Store subtitle, the onboarding first screen, and the paywall headline.

---

## Viral Loop Design

```
User logs meal
     │
     ▼
Score is high (≥80) → "Share your score" nudge appears
     │
     ▼
User shares to Instagram/iMessage
     │
     ▼
Friend sees "MacroLog scored my lunch 87/100" card
     │
     ▼
Friend taps → App Store → installs → sees BYOK or trial CTA
```

Only nudge sharing when the score is good (≥80). Nobody shares a 42. This ensures:
- Shared content is positive and appealing
- App association is with healthy eating success, not failure
- Organic reach via aspirational content (exactly how Cal AI went viral on TikTok)

---

## Implementation Priority

| Item | Impact | Effort | Do first? |
|---|---|---|---|
| Health breakdown panel (MealReviewModal) | High | Low | **Yes — ship this week** |
| Score explanation sheet | Medium | Low | **Yes — ship this week** |
| Daily score on Home | Medium | Low | Yes |
| Shareable meal card | High | Medium | Next sprint |
| Weekly Wrapped card | Medium | Medium | After share card |

The first two items require zero new AI capability, zero new data, and zero new dependencies.
They just render data that's already there. This is the easiest high-impact change in the codebase.

---

## Tradeoffs

| Pros | Cons |
|---|---|
| Data already exists — no new AI calls | Users may distrust AI-generated health scores (NPR noted this) |
| Shareable cards = free user acquisition | Canvas rendering on older iPhones needs testing |
| Goal-personalized score is genuinely novel | Score accuracy depends on AI — wrong food ID = wrong score |
| Three-axis breakdown is educational and sticky | MealScore already has multi-axis scores (though not personalized) |
| Low implementation effort for high visual impact | Share nudge UX must be non-annoying (only high scores, opt-in feel) |

## Alignment

- [x] Follows architectural layering rules — all UI-only changes, no backend needed
- [x] Developer Experience — canvas share uses existing Capacitor Share plugin
- [x] Consistent with existing patterns — extends MealReviewModal, uses existing helpers
- [x] Adds clear App Store-differentiating value without adding complexity to the core logging flow

## Evidence

### Health breakdown is already in the AI prompt (openai.ts lines 44–53):
```
- healthScore: score from 0-100 based on three factors
- healthBreakdown: object with three scores (0-100 each):
  - nutrientDensity: vitamins, minerals, fiber content
  - processingLevel: whole foods (high) vs processed foods (low)
  - goalAlignment: how well it fits user's goals (X cal, Xg protein...)
- healthReason: brief technical explanation
```

### Competitor evidence:
- Yuka: 60M users, barcode-based health score with breakdown → proves users want and share food scores
- Cal AI: viral via social sharing of meal photos + stats → proves share mechanic works for food logging
- MealScore: multi-axis AI health scoring exists but is not goal-personalized
- Spotify Wrapped: 2.1M social mentions in 48h from shareable personal stat cards → canonical proof that
  personalized shareable cards drive viral growth

### NPR caveat (May 2025):
Apps that rate food on overall nutrient content outperform those focusing on single ingredients.
MacroLog's composite approach (nutrient density + processing + goal alignment) aligns with this
guidance. Transparency about the scoring method (item 5: explanation sheet) addresses the trust gap.

## Verdict

*Recommend: implement health breakdown panel and score explanation sheet immediately — zero cost,
maximum differentiation. Shareable meal card is the highest-leverage next step for growth.*
