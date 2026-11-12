# Majidadi Shop mobile app

Expo Router customer app for the existing Majidadi backend and Supabase project.

## Configure

Copy `.env.example` to `.env` and set:

- `EXPO_PUBLIC_API_BASE_URL`: backend API root ending in `/api`
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

Only public Supabase client configuration belongs in this file. Never add service-role or Paystack secret keys.

For a physical device, use a backend URL reachable over the network, not `localhost`. The Paystack app return uses the registered `majidadi://payment/callback` scheme and requires a native development or production build; configure a matching app build before testing payment redirects.

## Run

```sh
npm install
npx expo start
```

Open the app in an Android emulator or iOS simulator. Customer product, cart, order, and payment data are read from the existing backend.
