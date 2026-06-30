import { createClient } from "@/lib/supabase/server";
import { FREE_PLAN_CREDITS } from "@/lib/constants";
import type { Profile } from "@/lib/types";
import type { User } from "@supabase/supabase-js";

/**
 * Returns the authenticated user + their profile row.
 * Redirect-protection is handled by middleware; this just loads data.
 * Falls back to a synthesised profile if the `handle_new_user` trigger
 * hasn't created the row yet (e.g. first request after signup).
 */
export async function getSessionProfile(): Promise<{
  user: User;
  profile: Profile;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profile) {
    return { user, profile: profile as Profile };
  }

  // Trigger hasn't run yet — return a sane default so the UI can render.
  const fallback: Profile = {
    id: user.id,
    email: user.email ?? null,
    full_name: (user.user_metadata?.full_name as string) ?? null,
    avatar_url: (user.user_metadata?.avatar_url as string) ?? null,
    plan: "free",
    credits: FREE_PLAN_CREDITS,
    subscription_status: "inactive",
    stripe_customer_id: null,
    created_at: new Date().toISOString(),
  };
  return { user, profile: fallback };
}
