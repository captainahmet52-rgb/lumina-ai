import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { env } from "@/lib/env";

/**
 * POST /api/checkout — create a Stripe Checkout Session for Creator Pro
 * (spec §9). Returns the hosted Checkout URL; the client redirects there.
 * Raw card data is never collected on our servers (spec §3.4 PCI note).
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let stripe: ReturnType<typeof getStripe>;
  try {
    stripe = getStripe();
  } catch {
    return NextResponse.json(
      { error: "Payments are not configured." },
      { status: 503 },
    );
  }

  // Reuse an existing Stripe customer if we have one.
  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id, plan")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.plan === "pro") {
    return NextResponse.json(
      { error: "You're already on Creator Pro." },
      { status: 400 },
    );
  }

  let customerId = profile?.stripe_customer_id ?? undefined;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;

    // Persist with service role (RLS doesn't allow this column update path).
    const admin = createAdminClient();
    await admin
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: env.stripePriceId, quantity: 1 }],
    success_url: `${env.appUrl}/payments?status=success`,
    cancel_url: `${env.appUrl}/payments?status=cancelled`,
    allow_promotion_codes: true,
    subscription_data: {
      metadata: { supabase_user_id: user.id },
    },
    metadata: { supabase_user_id: user.id },
  });

  if (!session.url) {
    return NextResponse.json(
      { error: "Could not create checkout session." },
      { status: 500 },
    );
  }

  return NextResponse.json({ url: session.url });
}
