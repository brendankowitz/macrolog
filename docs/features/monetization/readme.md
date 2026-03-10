# Feature: Monetization

**Status**: Planning
**Created**: 2026-03-09

## Overview

Move MacroLog from a bring-your-own-API-key model to a managed subscription service. The app currently stores the OpenRouter key on-device, which cannot work for a paid service — users could bypass payment entirely. A backend proxy is required to hide the key and enforce quotas.

## Goals

- Remove the OpenRouter API key field from the app entirely
- Add a subscription tier with a 7-day free trial
- Build a secure backend that proxies all AI calls
- Achieve 80% gross margin at 4 photos/day × 30 days usage

## Investigations

| Investigation | Approach | Status |
|---|---|---|
| [azure-subscription-backend](investigations/azure-subscription-backend.md) | Azure C# Functions + RevenueCat subscription model | In Progress |
| [health-score-differentiation](investigations/health-score-differentiation.md) | Surface hidden health breakdown data as the core UI differentiator + viral share mechanic | In Progress |

## Key Constraints

- Apple IAP mandatory for digital services sold in-app (no Stripe)
- "Sign in with Apple" required if offering any third-party login
- API key must never appear in the app binary or network traffic
- Backend must validate subscription status before serving each request

## Out of Scope (Phase 1)

- Android / Google Play billing
- Web/web checkout flow
- Referral or affiliate programs
