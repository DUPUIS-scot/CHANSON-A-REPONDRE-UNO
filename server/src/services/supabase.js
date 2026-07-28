import { createClient } from '@supabase/supabase-js';

let client;
let signature;
let adminClient;
let adminSignature;

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

export function getSupabaseAdminClient(environment) {
  const nextSignature =
    `${environment.supabaseUrl}:${environment.supabaseServiceRoleKey}`;
  if (!adminClient || adminSignature !== nextSignature) {
    adminClient = createClient(
      environment.supabaseUrl,
      environment.supabaseServiceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      },
    );
    adminSignature = nextSignature;
  }
  return adminClient;
}
