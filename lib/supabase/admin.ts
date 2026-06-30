import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import type { Database } from "@/lib/types";

/**
 * Service-role Supabase client — BYPASSES RLS.
 * SERVER-ONLY. Never import this into a client component.
 * Used by webhook callbacks (n8n + Stripe) to update rows the user can't.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    env.supabaseUrl,
    env.supabaseServiceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
