import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";
import type { Profile } from "@/lib/types";

// Stripe needs the raw, unparsed body to verify the signature.
export const runtime = "nodejs";

/**
 * POST /api/webhook/stripe — sync subscription state to `profiles` (spec §9).
 * checkout.session.completed / customer.subscription.updated → plan = 'pro'
 * customer.subscription.deleted → plan = 'free'
 */
export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const stripe = getStripe();
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      env.stripeWebhookSecret,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json(
      { error: `Webhook Error: ${message}` },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  /** Resolve the Supabase user id from a Stripe customer / metadata. */
  async function resolveUserId(
    customerId: string | null,
    metadataUserId?: string | null,
  ): Promise<string | null> {
    if (metadataUserId) return metadataUserId;
    if (!customerId) return null;
    const { data } = await admin
      .from("profiles")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();
    return (data?.id as string) ?? null;
  }

  async function setPlan(
    userId: string,
    plan: "free" | "pro",
    status: string,
    customerId?: string,
  ) {
    const update: Partial<Profile> = {
      plan,
      subscription_status: status,
    };
    if (customerId) update.stripe_customer_id = customerId;
    await admin.from("profiles").update(update).eq("id", userId);
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerId =
        typeof session.customer === "string" ? session.customer : null;
      const userId = await resolveUserId(
        customerId,
        session.metadata?.supabase_user_id,
      );
      if (userId) {
        await setPlan(userId, "pro", "active", customerId ?? undefined);
      }
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId =
        typeof sub.customer === "string" ? sub.customer : null;
      const userId = await resolveUserId(
        customerId,
        sub.metadata?.supabase_user_id,
      );
      if (userId) {
        const isActive = sub.status === "active" || sub.status === "trialing";
        await setPlan(
          userId,
          isActive ? "pro" : "free",
          sub.status,
          customerId ?? undefined,
        );
      }
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId =
        typeof sub.customer === "string" ? sub.customer : null;
      const userId = await resolveUserId(
        customerId,
        sub.metadata?.supabase_user_id,
      );
      if (userId) {
        await setPlan(userId, "free", "canceled", customerId ?? undefined);
      }
      break;
    }

    default:
      // Unhandled event types are acknowledged with 200.
      break;
  }

  return NextResponse.json({ received: true });
}
