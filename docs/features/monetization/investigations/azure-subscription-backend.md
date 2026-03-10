# Investigation: Azure C# Functions + Subscription Model

**Feature**: monetization
**Status**: In Progress
**Created**: 2026-03-09

## Approach

Build an Azure Functions (C#, Isolated Worker) backend that acts as a secure proxy for all OpenRouter calls. The app never holds an API key — it sends a bearer token (from Sign in with Apple / RevenueCat JWT) and an image, the backend validates the subscription, enforces a daily quota, and forwards the request to OpenRouter.

RevenueCat handles in-app purchase validation and sends webhooks to the backend on subscription changes. Azure Key Vault stores the OpenRouter key server-side.

### Subscription Tiers

| Tier | Limit | Price | Trial |
|---|---|---|---|
| Free | 5 analyses / lifetime (onboarding only) | $0 | — |
| Pro Monthly | Unlimited | $3.99/month | 7 days |
| Pro Annual | Unlimited | $29.99/year | 7 days |

### Unit Economics (Pro Monthly at scale)

| Item | Value |
|---|---|
| Photos/day assumption | 4 |
| Photos/month | 120 |
| OpenRouter cost @ ~$0.006/photo | $0.72 |
| Azure Functions cost (est.) | ~$0.02 |
| Total variable cost/subscriber | **~$0.74** |
| Monthly price | $3.99 |
| Apple cut — year 1 (30%) | $1.20 |
| Apple cut — year 1+ SBP (15%) | $0.60 |
| **Net margin (SBP)** | ($3.99 − $0.60 − $0.74) / $3.99 = **~66%** |
| **Net margin (after year 1, SBP)** | ~66% |
| **Gross margin (before Apple cut)** | ($3.99 − $0.74) / $3.99 = **~81.5%** ✓ |

> Gross margin target of 80% is met at $3.99/month. Net margin after Apple's 15% SBP cut is ~66%, which is healthy. Apply for [Small Business Program](https://developer.apple.com/app-store/small-business-program/) on day one.

Annual plan ($29.99) net margin is higher because the API cost ceiling doesn't change but Apple's effective per-month cut is lower.

### Architecture

```
iOS App
  │  (Bearer token + base64 image)
  ▼
Azure Function: POST /api/analyze
  ├── 1. Validate Apple ID token (JWKS endpoint)
  ├── 2. Look up user record in Azure Cosmos DB
  ├── 3. Check subscription status (RevenueCat REST API or cached webhook data)
  ├── 4. Enforce quota (free tier only)
  ├── 5. Fetch OpenRouter API key from Azure Key Vault
  ├── 6. Forward request to OpenRouter → get food JSON
  ├── 7. Increment usage counter in Cosmos DB
  └── 8. Return food items JSON to app

RevenueCat Webhook → Azure Function: POST /api/webhooks/revenuecat
  └── Update subscription_status in Cosmos DB

App Store → RevenueCat (receipt validation, handled automatically)
```

### Azure Resources

| Resource | Tier | Est. Monthly Cost |
|---|---|---|
| Azure Functions (Consumption plan) | Pay-per-execution | ~$0 at low volume, <$5 at 10k MAU |
| Azure Table Storage | LRS | ~$0.01–0.10 at low volume |
| Azure Key Vault | Standard | ~$0.03 |
| Azure App Insights | Basic | Free up to 5GB |
| **Total infra** | | **~$5–15/month** |

### Cosmos DB Schema

```csharp
// Azure Table Storage — Table: "users"
// PartitionKey = userId (Apple sub identifier)
// RowKey = "profile"
public class UserEntity : ITableEntity
{
    public string PartitionKey { get; set; }  // apple_sub_xxxxxx
    public string RowKey { get; set; }        // "profile"
    public string Email { get; set; }
    public string SubscriptionStatus { get; set; }  // active | trialing | expired | none
    public DateTime? SubscriptionExpiry { get; set; }
    public DateTime? TrialEndsAt { get; set; }
    public int FreeAnalysesUsed { get; set; }
    public string RevenuecatCustomerId { get; set; }
    public DateTimeOffset? Timestamp { get; set; }
    public ETag ETag { get; set; }
}
```

### Azure Function Endpoints

```csharp
// POST /api/analyze
// Headers: Authorization: Bearer <apple-id-token>
// Body: { images: string[], contextNotes?: string, userGoals: {...} }
// Returns: FoodItem[]

// POST /api/auth/signin
// Body: { identityToken: string, authorizationCode: string }
// Returns: { userId: string, jwt: string, subscriptionStatus: string }

// GET /api/subscription/status
// Headers: Authorization: Bearer <jwt>
// Returns: { status: string, expiresAt: string, trialEndsAt: string }

// POST /api/webhooks/revenuecat
// Headers: Authorization: Bearer <revenuecat-webhook-secret>
// Body: RevenueCat event payload
// Returns: 200 OK
```

### App Changes Required

| Change | Effort | Notes |
|---|---|---|
| Remove "Enter API key" from Settings | Trivial | Delete the section from Settings.tsx |
| Add Sign in with Apple | Low | `@capacitor-community/apple-sign-in` |
| Store JWT in Capacitor SecureStoragePlugin | Low | Replace openrouter_api_key in StorageService |
| Update OpenAIService to call `/api/analyze` | Medium | Replace direct OpenRouter calls |
| Add paywall screen | Medium | Show after free allotment exhausted |
| Add RevenueCat SDK | Medium | `@revenuecat/purchases-capacitor` |
| Show subscription status in Settings | Low | Replace API key section |
| 7-day trial UI (countdown/badge) | Low | Surface in Home header |

### RevenueCat Configuration

- Product IDs: `macrolog_pro_monthly`, `macrolog_pro_annual`
- Entitlement: `pro`
- Offering: `default` (show annual prominently with "Save 37%" badge)
- Trial: 7-day introductory offer on both products
- Webhook URL: `https://<func-app>.azurewebsites.net/api/webhooks/revenuecat`

### 7-Day Trial Flow

1. User installs app → sees "5 free analyses to try" (no account needed)
2. User hits limit → paywall shows: "Start 7-day free trial"
3. User taps → StoreKit prompts for Apple ID (no extra login step if Sign in with Apple already done)
4. Trial starts → RevenueCat webhook fires → Cosmos DB updated to `trialing`
5. Day 7 → auto-converts to paid or cancels → webhook fires again
6. App polls `/api/subscription/status` on foreground resume

### Security Considerations

- OpenRouter key stored only in Azure Key Vault, fetched at runtime via Managed Identity (no secrets in config)
- Apple ID tokens verified using Apple's public JWKS — do not trust client-claimed user IDs
- RevenueCat webhook secret stored in Key Vault, verified on every webhook call
- Rate limit `/api/analyze` per userId (Azure API Management or in-function throttle)
- CORS locked to `capacitor://localhost` and `https://macrolog.app`

## Tradeoffs

| Pros | Cons |
|---|---|
| Azure Functions scales to zero — no idle cost | C# cold starts (~200–500ms) on Consumption plan |
| Cosmos DB serverless matches bursty mobile traffic | Cosmos DB can be expensive at high read/write volume |
| Managed Identity = zero secret rotation burden | Azure setup is more complex than Supabase/Cloudflare |
| Key Vault + JWKS = defence-in-depth | Need to handle Apple JWKS key rotation |
| RevenueCat webhook keeps subscription state fresh | Webhook delivery not guaranteed — need fallback polling |
| 80%+ gross margin target met at $3.99/month | Apple takes 30% year 1 (SBP application needed on launch) |

## Alignment

- [x] Follows architectural layering rules — backend is a thin proxy, no business logic leaks client-side
- [x] Developer Experience — local development via Azure Functions Core Tools + Azurite emulator
- [x] Specification compliance — Apple IAP mandatory for digital services (compliant)
- [x] Consistent with existing patterns — app already uses `fetch` for OpenRouter; same pattern against new endpoint

## Evidence

### Market Research (March 2026)

**The space is extremely crowded and consolidating fast.**

- **Cal AI** (photo → calories, same core concept) hit 15M downloads and $40M+ ARR in under 2 years and was [acquired by MyFitnessPal in December 2025](https://techcrunch.com/2026/03/02/myfitnesspal-has-acquired-cal-ai-the-viral-calorie-app-built-by-teens/). Cal AI's moat was not AI accuracy — it was extreme simplicity (3-second photo) + viral TikTok marketing by teen founders. Their depth-sensor volume estimation was a real differentiator.
- **MacroFactor** added AI photo logging for Gold subscribers (Sept 2025).
- **Fuel Nutrition** has conversational AI correction: after a photo scan, users can say "that was closer to two cups" and the AI adjusts. This is meaningfully better UX than single-shot analysis.
- **MyFitnessPal** integrated ChatGPT Health (Jan 2026) and now owns Cal AI.
- Market is projected at $5.76B (2025) → $27.7B (2035). Growing fast, but the giants are buying AI-native challengers.

**Unique features MacroLog has today that competitors lack:**
- Health score breakdown (nutrientDensity + processingLevel + goalAlignment) — genuinely differentiated framing vs raw macros
- Multi-photo support for complex meals
- Encouragement/coaching voice baked into analysis output

**Features Cal AI had that MacroLog lacks:**
- Depth-sensor volume estimation (requires native Swift/Kotlin work)
- Groups / social sharing
- Progress photo timeline
- Conversational correction after analysis

### BYOK vs Managed Subscription

BYOK (bring your own key) is a real niche: [byoklist.com](https://byoklist.com/) and [byok.tech](https://www.byok.tech/) track this pattern. The audience is cost-conscious, tech-savvy developers/hobbyists who have API key fatigue with subscription services.

**BYOK pros for MacroLog:**
- Zero backend cost — ship now, no infra
- Differentiates from slick consumer apps (anti-MFP positioning)
- No Apple IAP complexity
- Honest pricing — users pay OpenRouter directly at cost

**BYOK cons for MacroLog:**
- Addressable market is maybe 2-5% of potential health app users
- OpenRouter account setup is a high-friction onboarding step
- Can't grow via App Store featuring (Apple features managed apps)
- Zero MRR unless you charge for the app shell itself

**Verdict on BYOK**: Good for validating demand with zero cost, bad for monetization at scale. The current app is already BYOK. The question is whether to stay there indefinitely or treat it as Phase 1.

### RevenueCat Pricing

**Free up to $2,500 MTR** (Monthly Tracked Revenue = gross IAP revenue before Apple's cut). At $3.99/month that's ~626 paying subscribers before paying RevenueCat anything. After $2,500 MTR: **1% of revenue**. At 1,000 subs (~$3,990/month) RevenueCat costs $39.90/month — completely acceptable. No reason to avoid it.

Source: [RevenueCat Pricing](https://www.revenuecat.com/pricing/)

### Azure Table Storage vs Cosmos DB

For MacroLog's user schema (userId → subscription status, expiry, analyses used), **Azure Table Storage is the right call**:

| | Table Storage | Cosmos DB Serverless |
|---|---|---|
| Storage cost | $0.045/GB | $0.25/GB |
| Transaction cost | $0.0036 per 10k ops | $0.25 per 1M RUs |
| At 10k users, 1M ops/month | ~$0.36 | ~$0.25 |
| Query flexibility | Key-value only | SQL / rich queries |
| SDK | Azure.Data.Tables (C#) | CosmosClient |
| Complexity | Minimal | Moderate |

**Decision: use Azure Table Storage.** The schema is pure key-value (partitionKey = userId, rowKey = "profile"). No complex queries needed. Cost is essentially zero until significant scale.

### Existing Codebase

- `macrolog-ionic-react/src/services/openai.ts` — current `POST /v1/chat/completions` call with `Bearer ${apiKey}`. The `apiKey` parameter becomes the backend JWT instead; the function signature stays similar.
- `macrolog-ionic-react/src/services/storage.ts` — stores `openrouter_api_key` in Capacitor Preferences. This becomes a `user_jwt` field post-migration.
- `macrolog-ionic-react/src/pages/Settings.tsx` — entire "OpenRouter API" section (lines 118–187) is removed; replaced by "Subscription" section showing status + manage button.
- `MONETIZATION.md` — prior analysis recommending Supabase/Edge Functions. This investigation chooses Azure Functions instead per user requirement; the RevenueCat + IAP strategy is identical.

### Model Cost Verification

Current model: `qwen/qwen3.5-flash` (premium). OpenRouter pricing for Qwen 3.5 Flash:
- Vision input: ~$0.004–$0.008 per image (800–1,200 tokens at ~$0.005/1K)
- Conservative estimate: **$0.006/image** used in calculations above

At 4 images/day × 30 = 120 images/month × $0.006 = **$0.72 API cost/subscriber/month**

### Pricing Benchmark

| App | Price | Notes |
|---|---|---|
| Cronometer Gold | $2.99/month | Manual logging, no AI |
| Lose It! Premium | $4.99/month | Barcode + AI logging |
| MyFitnessPal Premium | $9.99/month | Full diet platform |
| Noom | $16.67/month | Coaching + tracking |

$3.99/month positions MacroLog below Lose It! — competitive for a photo-first AI logging app.

### Alternative Approaches (future investigations)

1. **Supabase + Edge Functions** — simpler setup, generous free tier, TypeScript-native. Worth investigating if Azure complexity is a barrier.
2. **Cloudflare Workers** — fastest cold starts, $5/month flat, no SDK — but less Azure ecosystem alignment.
3. **Credit bundles (consumable IAP)** — sell packs of 50/200 analyses. Lower friction, no subscription fatigue, but unpredictable MRR and churn risk when credits run out.

## Verdict

*Pending evaluation — recommend proceeding to ADR after validating RevenueCat trial flow and Azure Functions cold-start latency meets UX bar (<800ms p95).*
