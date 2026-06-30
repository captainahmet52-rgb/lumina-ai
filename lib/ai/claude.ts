const MODEL = "claude-haiku-4-5-20251001";

function buildScriptPrompt(productName: string, videoPrompt: string): string {
  return `You are an expert UGC video script writer. Create exactly 3 raw 12-second UGC video scripts.

**USER DIRECTION (MOST IMPORTANT - follow this exactly):**
${videoPrompt}

**PRODUCT:** ${productName}

**YOU HAVE TWO IMAGES:**
- Image 1: The CHARACTER (the real person who will appear in the video)
- Image 2: The PRODUCT being promoted

**RULES:**
- Scripts must match the user's direction above (funny, serious, energetic, etc.)
- The character in Image 1 is the UGC creator — write scripts that fit their appearance and vibe
- Raw iPhone aesthetic: shaky, handheld, no text overlays, no professional production
- Each script is exactly 12 seconds
- Natural speech with filler words ("like", "literally", "honestly", "I mean")
- NO invented details about the product beyond what's visible in the image

**OUTPUT FORMAT:**
SCRIPT 1: [angle title]
Energy: [one line describing the vibe]
[0:00-0:02] "[opening - 4-6 words, mid-thought energy]"
[0:02-0:09] "[main content - 20-25 words, natural speech, conversational]"
[0:09-0:12] "[close - 3-5 words]"
Shot breakdown: [brief second-by-second camera/action notes]`;
}

type AnthropicResponse = {
  content: { type: string; text: string }[];
};

/**
 * Claude Haiku ile UGC video scriptleri üretir.
 * İki görsel (karakter + ürün) ve kullanıcı promptunu alır.
 */
export async function generateScripts(
  productName: string,
  videoPrompt: string,
  characterBase64: string,
  productBase64: string,
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY eksik.");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: characterBase64,
              },
            },
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/png",
                data: productBase64,
              },
            },
            {
              type: "text",
              text: buildScriptPrompt(productName, videoPrompt),
            },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude Haiku hatası: ${err}`);
  }

  const data = (await res.json()) as AnthropicResponse;
  return data.content.find((c) => c.type === "text")?.text ?? "";
}

/** Ham script metnini 3 ayrı script'e böler. */
export function splitScripts(rawText: string): string[] {
  const parts = rawText.split(/SCRIPT\s+\d+:/i).filter((s) => s.trim());
  return parts.map((p, i) => `SCRIPT ${i + 1}:${p.trim()}`).slice(0, 3);
}
