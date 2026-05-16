
  # User dashboard

  This is a code bundle for User dashboard. The original project is available at https://www.figma.com/design/Ta4zpJVl2r4EaYH1nTIEQ8/User-dashboard.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.
  ## Firebase Migration

  This project was migrated from Supabase to Firebase. All backend key-value storage now uses Firebase Firestore.

  ### Firebase Setup
  1. Create a Firebase project at https://console.firebase.google.com/
  2. Go to Project Settings > General > Your apps > Add app (Web)
  3. Copy your Firebase config and replace the placeholders in `utils/firebase/config.ts`.
  4. In Firestore, create a collection named `kv_store` for key-value storage.

  ### Usage
  - All frontend logic remains unchanged.
  - Backend storage logic is now in `utils/firebase/kv_store.ts`.
  - Use the exported functions (`set`, `get`, `del`, `mset`, `mget`, `mdel`, `getByPrefix`) as before, but import from `utils/firebase/kv_store`.

  ---
  **Note:** Remove any Supabase-specific code and dependencies if no longer needed.
  