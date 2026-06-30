import { createAdminClient } from "@/lib/supabase/admin";
import { generateScripts } from "@/lib/ai/claude";
import { startVideoGeneration, pollUntilComplete } from "@/lib/ai/kling";
import type { Generation } from "@/lib/types";

export type PipelineInput = {
  generationId: string;
  userId: string;
  characterImageUrl: string;
  productImageUrl: string;
  productName: string;
  videoPrompt: string;
};

async function updateGeneration(generationId: string, update: Partial<Generation>) {
  const admin = createAdminClient();
  await admin.from("generations").update(update).eq("id", generationId);
}

async function imageUrlToBase64(url: string): Promise<string> {
  const res = await fetch(url);
  const buffer = await res.arrayBuffer();
  return Buffer.from(buffer).toString("base64");
}

/**
 * Tam pipeline:
 * 1. İki görseli base64'e çevir
 * 2. Gemini ile script üret (karakter + ürün görseli + kullanıcı promptu)
 * 3. Her script için Prototipal'da video üret (karakter görseli referans)
 * 4. Supabase'i güncelle → Realtime frontend'e bildirir
 */
export async function runGenerationPipeline(input: PipelineInput) {
  const { generationId, characterImageUrl, productImageUrl, productName, videoPrompt } = input;

  try {
    // ── Adım 1: Görselleri indir ───────────────────────────────────
    await updateGeneration(generationId, {
      status: "processing",
      metadata: { step: "Görseller hazırlanıyor…", product_name: productName, character_image_url: characterImageUrl },
    });

    const [characterBase64, productBase64] = await Promise.all([
      imageUrlToBase64(characterImageUrl),
      imageUrlToBase64(productImageUrl),
    ]);

    // ── Adım 2: Gemini ile script üret ────────────────────────────
    await updateGeneration(generationId, {
      metadata: {
        step: "UGC video scriptleri yazılıyor…",
        product_name: productName,
        character_image_url: characterImageUrl,
      },
    });

    const rawScript = await generateScripts(
      productName,
      videoPrompt,
      characterBase64,
      productBase64,
    );

    // ── Adım 3: Tek video üret ─────────────────────────────────────
    await updateGeneration(generationId, {
      metadata: {
        step: "Video üretiliyor… (2-3 dk sürebilir)",
        product_name: productName,
        character_image_url: characterImageUrl,
      },
    });

    const videoJobId = await startVideoGeneration(rawScript, characterImageUrl);
    const videoUrl = await pollUntilComplete(videoJobId);

    if (!videoUrl) {
      throw new Error("Video üretilemedi.");
    }

    // ── Adım 4: Tamamlandı ─────────────────────────────────────────
    await updateGeneration(generationId, {
      status: "completed",
      video_url: videoUrl,
      completed_at: new Date().toISOString(),
      metadata: {
        step: "Tamamlandı",
        product_name: productName,
        character_image_url: characterImageUrl,
      },
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Pipeline hatası";
    await updateGeneration(generationId, {
      status: "failed",
      error: errorMsg,
      completed_at: new Date().toISOString(),
    });
  }
}
