import { env } from "@/lib/env";

export type WebhookPayload = {
  productName: string;
  productimage: string;
};

export type GenerationWebhookInput = {
  generationId: string;
  userId: string;
  productImageUrl: string;
  productName: string;
};

export function buildWebhookPayload(input: GenerationWebhookInput): WebhookPayload {
  return {
    productName: input.productName,
    productimage: input.productImageUrl,
  };
}

export async function triggerGenerationWebhook(
  input: GenerationWebhookInput,
): Promise<{ ok: boolean; error?: string }> {
  const url = env.n8nWebhookUrl;
  if (!url) {
    return { ok: false, error: "N8N_WEBHOOK_URL is not configured." };
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildWebhookPayload(input)),
    });

    if (!res.ok) {
      return { ok: false, error: `Webhook responded ${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Webhook request failed",
    };
  }
}

export function isValidCallbackSecret(provided: string | null | undefined) {
  if (!provided) return false;
  const expected = env.webhookCallbackSecret;
  if (provided.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}
