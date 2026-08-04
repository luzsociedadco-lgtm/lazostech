# UniMarket mobile shell

This Expo app wraps the public UniMarket experience and adds a native
RevenueCat purchase surface for a verified-seller plan. It is intentionally a
small mobile shell so the existing web marketplace remains unchanged.

## Setup

```powershell
cd mobile
npm install
Copy-Item .env.example .env
# Replace the two public RevenueCat app keys in .env.
```

Configure the RevenueCat project with the Android/iOS app identifiers from
`app.json`, create a Test Store product, entitlement, and current offering,
then build a development client. Expo Go can preview the UI, but a development
build is required to exercise native purchases.

```powershell
npx eas login
npx eas build:configure
npx eas build --platform android --profile development
npx expo start
```

Do not commit `.env` or secret RevenueCat keys. The values used by the app are
public, platform-specific RevenueCat app keys.
