const MODEL = "claude-haiku-4-5-20251001";

async function imageToBase64(
  url: string,
): Promise<{ data: string; mime: string }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Görsel indirilemedi (${res.status})`);
  const buf = Buffer.from(await res.arrayBuffer());
  return {
    data: buf.toString("base64"),
    mime: res.headers.get("content-type") || "image/jpeg",
  };
}

/** İstenen video süresine göre yaklaşık kelime sayısı (~2.2 kelime/sn). */
function wordTarget(seconds: number): string {
  const words = Math.round(seconds * 2.2);
  return `about ${words} words (roughly ${seconds} seconds of natural speech)`;
}

export interface SpeechInput {
  characterImageUrl: string;
  productImageUrl: string;
  productName: string;
  videoPrompt: string;
  seconds: number;
}

/**
 * Claude Haiku — karakter + ürün görselini görür, kullanıcının istediği tarza
 * göre karakterin söyleyeceği TÜRKÇE konuşma metnini üretir.
 * Sadece söylenen kelimeler döner (sahne yönergesi yok) — bu metin ElevenLabs'e
 * ses olarak, oradan da Kling AI Avatar'a gider.
 */
export async function generateTurkishSpeech(input: SpeechInput): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY eksik.");

  const [character, product] = await Promise.all([
    imageToBase64(input.characterImageUrl),
    imageToBase64(input.productImageUrl),
  ]);

  const instruction = `You write UGC ad scripts. Image 1 = the CHARACTER who will speak in the video. Image 2 = the PRODUCT being advertised.

USER DIRECTION (follow this exactly): ${input.videoPrompt}
PRODUCT NAME: ${input.productName}

Write ONLY the words the character SAYS out loud, in TURKISH. Requirements:
- Natural, casual, authentic — like a real person filming a UGC ad on their phone
- Match the user's direction (funny, sincere, energetic, etc.)
- Length: ${wordTarget(input.seconds)}
- Talk about the product naturally, mention what's visible in the product image
- NO stage directions, NO quotation marks, NO English — only the spoken Turkish words

Return only the spoken text, nothing else.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: character.mime, data: character.data } },
            { type: "image", source: { type: "base64", media_type: product.mime, data: product.data } },
            { type: "text", text: instruction },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`Claude hatası (${res.status}): ${await res.text()}`);
  }

  const data = (await res.json()) as {
    content: { type: string; text?: string }[];
  };
  const text = data.content.find((c) => c.type === "text")?.text ?? "";
  return text.trim();
}
