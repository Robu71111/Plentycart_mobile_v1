# Plentycart

A mobile shopping app (browse, cart, checkout, orders, returns) built as an Expo/React Native demo.

## Tech Stack

- **React Native** 0.81 + **Expo SDK 54**
- **TypeScript**
- **Expo Router v6** (file-based navigation)
- **NativeWind v4** (Tailwind CSS for React Native)
- **AsyncStorage**-backed demo data (no live backend — see [Demo-Only Mocks](#demo-only-mocks))

## Prerequisites

- **Node.js 20+**
- **Expo Go** app installed on your iOS or Android device ([App Store](https://apps.apple.com/app/expo-go/id982107779) / [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent))

## Setup

```bash
git clone <repo-url>
cd plentycart-mobile-app
npm install --legacy-peer-deps
npx expo start
```

> **Note:** `--legacy-peer-deps` is required due to peer dependency conflicts between React 19 and some Expo packages.

## Running on a Device

After `npx expo start`, a QR code appears in your terminal.

- **iOS**: Open the **Camera** app and point it at the QR code. Tap the notification to open the project in Expo Go.
- **Android**: Open the **Expo Go** app and use its built-in QR scanner to scan the code.

## Demo Credentials

Authentication is mocked — **any email/password combination will log you in**. There is no real account validation.

## Test Payment Card

Use the following card details on the checkout/payment screen:

| Field | Value |
|---|---|
| Card Number | `4242 4242 4242 4242` |
| Expiry | `12/28` |
| CVC | `123` |

## Project Structure

```
app/          # File-based routing (Expo Router) — each file/folder maps to a screen/route
  (auth)/     # Login & signup flow
  (tabs)/     # Main tab navigator (home, search, cart, orders, profile)
  checkout/   # Checkout flow (address, shipping, payment, confirmation)
  orders/     # Order detail & returns
  profile/    # Profile, addresses, payment methods, settings
components/   # Shared, reusable UI components
constants/    # App-wide constants (theme, config, etc.)
data/         # Demo/mock data used in place of a real backend
lib/          # Utilities and helpers
```

Routes are determined by file paths under `app/` — for example, `app/product/[id].tsx` handles `/product/123`. See the [Expo Router docs](https://docs.expo.dev/router/introduction/) for details.

## Demo-Only Mocks

This app is a **frontend demo** — the following are stubbed out and must be replaced with real integrations before production use:

- **Stripe Checkout** — payment screen accepts any test card values; no real charge is processed.
- **Shippo** — shipping rates/labels are hardcoded demo data, not fetched from a live carrier API.
- **Supabase Auth** — login/signup accept any credentials; there is no real user database or session management.

## Documentation

Additional project documentation (PRD, architecture overview, API spec) lives in [`/docs`](./docs).

## Contact

For questions or issues, reach out to: `<add contact email or Slack channel here>`
