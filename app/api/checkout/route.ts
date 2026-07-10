import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { env } from "@/lib/env";
import { CREDIT_PACKAGES } from "@/lib/constants";

type CheckoutBody = { package_id?: string };

/**
 * POST /api/checkout — seçilen kredi paketi için tek seferlik Stripe Checkout
 * oturumu oluşturur (TL). Ödeme başarılı olunca webhook krediyi hesaba ekler.
 * Kart bilgisi hiçbir zaman bizim sunucuya uğramaz (Stripe barındırır).
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401 });
  }

  let body: CheckoutBody;
  try {
    body = (await request.json()) as CheckoutBody;
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const pkg = CREDIT_PACKAGES.find((p) => p.id === body.package_id);
  if (!pkg) {
    return NextResponse.json({ error: "Paket bulunamadı." }, { status: 400 });
  }

  let stripe: ReturnType<typeof getStripe>;
  try {
    stripe = getStripe();
  } catch {
    return NextResponse.json(
      { error: "Ödeme sistemi yapılandırılmamış." },
      { status: 503 },
    );
  }

  // Varsa mevcut Stripe müşterisini yeniden kullan.
  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();

  let customerId = profile?.stripe_customer_id ?? undefined;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;

    const admin = createAdminClient();
    await admin
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: customerId,
    line_items: [
      {
        price_data: {
          currency: "try",
          product_data: {
            name: `Lumina AI · ${pkg.credits} Video Kredisi`,
            description: `${pkg.name} paketi`,
          },
          unit_amount: pkg.priceTry * 100, // kuruş
        },
        quantity: 1,
      },
    ],
    success_url: `${env.appUrl}/payments?status=success`,
    cancel_url: `${env.appUrl}/payments?status=cancelled`,
    metadata: {
      supabase_user_id: user.id,
      credits: String(pkg.credits),
      package_id: pkg.id,
    },
  });

  if (!session.url) {
    return NextResponse.json(
      { error: "Ödeme oturumu oluşturulamadı." },
      { status: 500 },
    );
  }

  return NextResponse.json({ url: session.url });
}
