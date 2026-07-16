// src/sync/supabaseClient.ts
// OWNER: shared · STATUS: sync layer, best-effort only (see uploadSession.ts)
//
// Credentials come from env, never hardcoded here. Expo inlines any
// EXPO_PUBLIC_* var from `pulihgo-app/.env` at build time — see .env.example
// for what to fill in. The anon key is meant to be public (it's constrained
// by Supabase Row Level Security policies on the table, not a secret); never
// put the service_role key in an EXPO_PUBLIC_* var, that one is a real secret.

import 'react-native-url-polyfill/auto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// `null` when credentials aren't configured (e.g. a fresh clone before
// filling in .env). uploadSession() checks this and no-ops with a warning
// instead of crashing — sync is a best-effort layer, never a requirement
// for the app to run (AGENTS.md guardrail 6: offline-first).
export const supabase: SupabaseClient | null =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: false }, // no patient login yet — see uploadSession.ts TODO(auth)
      })
    : null;

if (!supabase) {
  console.warn(
    '[supabaseClient] EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY not set — ' +
      'session sync to Supabase is disabled, sessions still save locally. See .env.example.'
  );
}
