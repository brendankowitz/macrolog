# MacroLog — Monetization Analysis

## Recommended Model: Freemium + Monthly Subscription

**Free tier:** 5 analyses/month
**Paid tier:** $2.99/month or $19.99/year — unlimited analysis

This is the right fit because cost scales linearly with usage (per API call), making
one-time purchases financially unviable.

---

## Model Comparison

| Model | Pros | Cons |
|---|---|---|
| Subscription (recommended) | Predictable revenue, 15% Apple cut after year 1 | Higher initial friction |
| Consumable credits | Low barrier, flexible | Churn when credits run out, unpredictable MRR |
| One-time premium unlock | Simple | Unsustainable — ongoing API costs don't stop |
| Pure free | Growth | No revenue |

---

## Apple Revenue Share

| Scenario | Apple takes |
|---|---|
| Subscription, year 1 | 30% |
| Subscription, year 1+ | 15% |
| Consumable IAP (always) | 30% |
| Small Business Program (<$1M/year revenue) | 15% on everything |

Apply for the Small Business Program immediately — almost certain to qualify at launch.

---

## Unit Economics

Qwen2.5-VL-72B on OpenRouter costs approximately $0.004–0.008 per image analysis
(~800–1,200 vision input tokens at $0.004/1K).

| | Value |
|---|---|
| Monthly price | $2.99 |
| Avg analyses/user/month | ~150 |
| API cost @ $0.006/call | $0.90 |
| Apple cut (15% SBP) | $0.45 |
| Net margin per subscriber | ~$1.64 |
| Annual price | $19.99 |
| Net margin per annual subscriber | ~$12.50 |

Annual subscribers are significantly more valuable — push them with a "save 44%" hook.

---

## The Architectural Problem

**The current app stores the OpenRouter key on-device.** This cannot work for a paid
service — users could use the key directly, bypassing payment entirely.

### Current architecture
```
User device --> OpenRouter API (user's own key)
```

### Required architecture
```
User device --> Your backend --> OpenRouter API (your key, server-side only)
```

The backend must:
1. Validate IAP receipts / subscription status with Apple
2. Track per-user quota (for free tier enforcement)
3. Proxy all OpenRouter calls — key never ships in the app
4. Expose a simple REST endpoint: `POST /analyze` with the image + auth token

---

## Recommended Tech Stack

### In-app payments: RevenueCat
The standard for Capacitor/React Native/Flutter apps.

```
npm install @revenuecat/purchases-capacitor
```

- Wraps StoreKit 2 and handles receipt validation
- Webhook to your backend on subscription change
- Dashboard with subscriber analytics, churn, MRR
- Free up to $2,500 MRR

### Backend: Supabase + Edge Functions
Simplest viable backend with a generous free tier.

- **Supabase Auth** — Sign in with Apple (mandatory if you have user accounts per App Store rules)
- **Postgres table** — `users(id, subscription_status, analyses_used, analyses_reset_date)`
- **Edge Function: `/analyze`**
  1. Verify bearer token (Supabase JWT)
  2. Check subscription status via RevenueCat REST API
  3. Check/decrement quota for free tier users
  4. Forward image to OpenRouter, return result

### Alternative: Cloudflare Workers
Even simpler, ~$5/month flat, cold starts are faster. Good if you want to avoid
Supabase complexity.

---

## App Changes Required

| Change | Effort |
|---|---|
| Remove "Enter your API key" from Settings | Trivial |
| Add Sign in with Apple | Low (Capacitor plugin exists) |
| Add paywall screen (shown after free tier) | Medium |
| Show "X analyses remaining" in Home header | Low |
| Route all API calls through backend | Medium |
| RevenueCat SDK integration | Medium |

**Settings page becomes:** Goals, notifications, account, subscription management.
No API key input — users never touch that.

---

## Paywall Placement

Show the paywall when:
- User hits their 5th free analysis and tries to log another
- User taps a "Go Unlimited" banner in the Home header (soft prompt)

Do **not** show it on first launch or before demonstrating value.

---

## Pricing Psychology

- Lead with annual: **$19.99/year** (prominently) vs $2.99/month
- "Less than a coffee a month" framing
- Highlight the free tier — "5 free analyses every month, no credit card"
- Trial: 7-day free trial on annual plan converts well for health apps

---

## App Store Considerations

- Must use Apple IAP for digital services sold in-app — no Stripe, no web checkout links
- "Sign in with Apple" is required if you offer any third-party or email login
- Subscription terms must be clearly displayed before purchase (StoreKit handles this)
- Auto-renewable subscriptions require a clearly accessible cancellation method
- Upgrade path: free users can always see what they're missing (tease the paywall)

---

## Phased Rollout

**Phase 1 — Launch free**
Ship with the current architecture. Users bring their own OpenRouter key.
Validate there is demand before investing in backend.

**Phase 2 — Managed backend**
Build the backend proxy. Remove the API key field. Offer 5 free analyses/month
with no key required — drastically lowers onboarding friction.

**Phase 3 — Monetize**
Add RevenueCat, build the paywall, submit for App Store review.
Price: $2.99/month, $19.99/year.

**Phase 4 — Optimize**
A/B test pricing, add annual trial, add referral/share incentives.
