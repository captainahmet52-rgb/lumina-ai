import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { startGeneration } from "@/lib/pipeline";

type GenerateBody = {
  character_image_url?: string;
  product_image_url?: string;
  product_name?: string;
  video_prompt?: string;
  seconds?: number;
  quality?: "standard" | "pro";
};

export const runtime = "nodejs";
export const maxDuration = 60; // faz 1: metin+ses+kuyruğa gönderme (~15sn)

const ALLOWED_SECONDS = [15, 30, 45];

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401 });
  }

  let body: GenerateBody;
  try {
    body = (await request.json()) as GenerateBody;
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const characterImageUrl = body.character_image_url?.trim();
  const productImageUrl = body.product_image_url?.trim();
  const productName = body.product_name?.trim();
  const videoPrompt = body.video_prompt?.trim();

  if (!characterImageUrl) {
    return NextResponse.json({ error: "Karakter görseli gerekli." }, { status: 400 });
  }
  if (!productImageUrl) {
    return NextResponse.json({ error: "Ürün görseli gerekli." }, { status: 400 });
  }
  if (!productName || productName.length < 2) {
    return NextResponse.json({ error: "Ürün adı en az 2 karakter olmalı." }, { status: 400 });
  }
  if (!videoPrompt || videoPrompt.length < 5) {
    return NextResponse.json({ error: "Video açıklaması yazılmalı." }, { status: 400 });
  }

  const seconds = ALLOWED_SECONDS.includes(body.seconds ?? 0)
    ? (body.seconds as number)
    : 15;
  const quality = body.quality === "pro" ? "pro" : "standard";

  // Kredi / plan kontrolü
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, credits")
    .eq("id", user.id)
    .maybeSingle();

  const plan = profile?.plan ?? "free";
  const credits = profile?.credits ?? 0;

  if (plan !== "pro" && credits <= 0) {
    return NextResponse.json({ error: "Krediniz bitti. Kredi yükleyin." }, { status: 402 });
  }

  // DB'ye kayıt — prompt alanına video_prompt yazıyoruz (gösterim için)
  const { data: generation, error: insertError } = await supabase
    .from("generations")
    .insert({
      user_id: user.id,
      product_image_url: productImageUrl,
      prompt: videoPrompt,
      status: "pending",
      metadata: {
        product_name: productName,
        character_image_url: characterImageUrl,
        step: "Başlatılıyor…",
      },
    })
    .select("id")
    .single();

  if (insertError || !generation) {
    return NextResponse.json({ error: "Kayıt oluşturulamadı." }, { status: 500 });
  }

  const generationId = generation.id as string;

  // Krediyi düş
  if (plan !== "pro") {
    const admin = createAdminClient();
    await admin
      .from("profiles")
      .update({ credits: Math.max(0, credits - 1) })
      .eq("id", user.id);
  }

  // Faz 1: metin + ses + fal kuyruğa gönder (await — ~10-15sn, serverless-safe)
  await startGeneration({
    generationId,
    userId: user.id,
    charged: plan !== "pro",
    characterImageUrl,
    productImageUrl,
    productName,
    videoPrompt,
    seconds,
    quality,
  });

  return NextResponse.json({ generation_id: generationId }, { status: 201 });
}
