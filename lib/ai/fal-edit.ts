import { fal } from "@fal-ai/client";

let configured = false;
function ensureConfig() {
  if (!configured) {
    const key = process.env.FAL_KEY;
    if (!key) throw new Error("FAL_KEY eksik.");
    fal.config({ credentials: key });
    configured = true;
  }
}

/** Sahne talimatı boşsa kullanılan genel amaçlı yerleştirme talimatı. */
const FALLBACK_SCENE =
  "The person from image 1 naturally wearing or holding the product from image 2, " +
  "product clearly visible, keep the person's face identity, pose and background unchanged, realistic photo";

/**
 * Nano Banana (Gemini görüntü düzenleme, fal üzerinden) — ürünü karaktere
 * GÖRSEL olarak uygular: giyilebilirse giydirir, değilse eline verir.
 * Dönen URL, Kling AI Avatar'a karakter görseli olarak gider — böylece
 * videoda ürün gerçekten karakterin üzerinde/elinde görünür.
 */
export async function applyProductToCharacter(
  characterImageUrl: string,
  productImageUrl: string,
  sceneInstruction: string,
): Promise<string> {
  ensureConfig();

  const prompt =
    (sceneInstruction.trim() || FALLBACK_SCENE) +
    ". Preserve the framing and orientation of image 1.";

  const result = await fal.subscribe("fal-ai/nano-banana/edit", {
    input: {
      prompt,
      image_urls: [characterImageUrl, productImageUrl],
      num_images: 1,
      output_format: "jpeg",
    },
  });

  const url = (
    result.data as { images?: { url?: string }[] }
  )?.images?.[0]?.url;

  if (!url) throw new Error("Ürün uygulama adımı görsel döndürmedi.");
  return url;
}
