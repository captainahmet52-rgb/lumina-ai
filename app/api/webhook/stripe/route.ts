import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";

// Stripe imza doğrulaması için ham (parse edilmemiş) gövde gerekir.
export const runtime = "nodejs";

/**
 * POST /api/webhook/stripe — tek seferlik kredi ödemesini işler.
 * checkout.session.completed → paketteki kredi kadar profil kredisini artırır.
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

  /** Stripe müşteri / metadata'dan Supabase kullanıcı id'sini çözer. */
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

  /** Kullanıcının kredisini `amount` kadar artırır. */
  async function addCredits(userId: string, amount: number) {
    const { data } = await admin
      .from("profiles")
      .select("credits")
      .eq("id", userId)
      .maybeSingle();
    const current = (data?.credits as number) ?? 0;
    await admin
      .from("profiles")
      .update({ credits: current + amount })
      .eq("id", userId);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    // Yalnızca ödeme tamamlandıysa krediyi ekle.
    if (session.payment_status === "paid") {
      const customerId =
        typeof session.customer === "string" ? session.customer : null;
      const userId = await resolveUserId(
        customerId,
        session.metadata?.supabase_user_id,
      );
      const credits = Number(session.metadata?.credits ?? 0);

      if (userId && credits > 0) {
        await addCredits(userId, credits);
      }
    }
  }

  return NextResponse.json({ received: true });
}
