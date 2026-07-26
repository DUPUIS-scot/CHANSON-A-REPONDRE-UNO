import { createClient } from '@supabase/supabase-js';

let client;
let signature;

export function getSupabaseAuthClient(environment) {
  const nextSignature =
    `${environment.supabaseUrl}:${environment.supabasePublishableKey}`;
  if (!client || signature !== nextSignature) {
    client = createClient(
    environment.supabaseUrl,
    environment.supabasePublishableKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
    );
    signature = nextSignature;
  }
  return client;
}
