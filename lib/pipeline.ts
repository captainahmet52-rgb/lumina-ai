import { createAdminClient } from "@/lib/supabase/admin";
import { generateTurkishSpeech } from "@/lib/ai/claude";
import { turkishSpeech } from "@/lib/ai/elevenlabs";
import {
  uploadAudio,
  submitAvatarJob,
  checkAvatarJob,
  type AvatarQuality,
} from "@/lib/ai/fal-avatar";
import type { Generation, GenerationMetadata } from "@/lib/types";

export type StartInput = {
  generationId: string;
  characterImageUrl: string;
  productImageUrl: string;
  productName: string;
  videoPrompt: string;
  seconds: number;
  quality: AvatarQuality;
};

async function update(generationId: string, patch: Partial<Generation>) {
  const admin = createAdminClient();
  await admin.from("generations").update(patch).eq("id", generationId);
}

/**
 * FAZ 1 (serverless-safe, /api/generate içinde await edilir, ~10-15sn):
 * Claude → TR metin, ElevenLabs → ses, fal'a video işini KUYRUĞA gönderir.
 * request_id'yi metadata'ya yazar; uzun video üretimini beklemez.
 */
export async function startGeneration(input: StartInput): Promise<void> {
  const {
    generationId,
    characterImageUrl,
    productImageUrl,
    productName,
    videoPrompt,
    seconds,
    quality,
  } = input;

  const baseMeta: GenerationMetadata = {
    product_name: productName,
    character_image_url: characterImageUrl,
    fal_quality: quality,
  };

  try {
    await update(generationId, {
      status: "processing",
      metadata: { ...baseMeta, step: "Konuşma metni yazılıyor…" },
    });
    const speech = await generateTurkishSpeech({
      characterImageUrl,
      productImageUrl,
      productName,
      videoPrompt,
      seconds,
    });

    await update(generationId, {
      metadata: { ...baseMeta, step: "Türkçe ses üretiliyor…", spoken_text: speech },
    });
    const audio = await turkishSpeech(speech);
    const audioUrl = await uploadAudio(audio);

    const requestId = await submitAvatarJob(characterImageUrl, audioUrl, quality);

    await update(generationId, {
      metadata: {
        ...baseMeta,
        step: "Video üretiliyor… (2-4 dk sürebilir)",
        spoken_text: speech,
        fal_request_id: requestId,
      },
    });
  } catch (err) {
    await update(generationId, {
      status: "failed",
      error: err instanceof Error ? err.message : "Üretim hatası",
      completed_at: new Date().toISOString(),
    });
  }
}

/**
 * FAZ 2 (sonuç ekranı yoklarken çağrılır):
 * fal kuyruğunu kontrol eder; video bittiyse kaydı `completed` yapar.
 * Döndürdüğü: güncel Generation satırı.
 */
export async function finalizeGeneration(
  generation: Generation,
): Promise<Generation> {
  if (generation.status === "completed" || generation.status === "failed") {
    return generation;
  }

  const meta = (generation.metadata ?? {}) as GenerationMetadata;
  const requestId = meta.fal_request_id as string | undefined;
  const quality = (meta.fal_quality as AvatarQuality) ?? "standard";

  if (!requestId) return generation; // henüz kuyruğa girmedi

  try {
    const job = await checkAvatarJob(requestId, quality);

    if (job.status === "COMPLETED" && job.videoUrl) {
      const admin = createAdminClient();
      const patch: Partial<Generation> = {
        status: "completed",
        video_url: job.videoUrl,
        completed_at: new Date().toISOString(),
        metadata: { ...meta, step: "Tamamlandı" },
      };
      await admin.from("generations").update(patch).eq("id", generation.id);
      return { ...generation, ...patch } as Generation;
    }

    if (job.status === "ERROR") {
      const admin = createAdminClient();
      const patch: Partial<Generation> = {
        status: "failed",
        error: "Video üretimi başarısız oldu.",
        completed_at: new Date().toISOString(),
      };
      await admin.from("generations").update(patch).eq("id", generation.id);
      return { ...generation, ...patch } as Generation;
    }
  } catch {
    // Geçici hata — bir sonraki yoklamada tekrar denenir.
  }

  return generation;
}
