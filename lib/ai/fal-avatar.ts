import { fal } from "@fal-ai/client";

export type AvatarQuality = "standard" | "pro";

export const AVATAR_MODELS: Record<AvatarQuality, string> = {
  standard: "fal-ai/kling-video/ai-avatar/v2/standard",
  pro: "fal-ai/kling-video/ai-avatar/v2/pro",
};

let configured = false;
function ensureConfig() {
  if (!configured) {
    const key = process.env.FAL_KEY;
    if (!key) throw new Error("FAL_KEY eksik.");
    fal.config({ credentials: key });
    configured = true;
  }
}

/** Türkçe ses (mp3) → fal storage → public URL. */
export async function uploadAudio(audio: Buffer): Promise<string> {
  ensureConfig();
  const file = new File([new Uint8Array(audio)], "speech.mp3", {
    type: "audio/mpeg",
  });
  return fal.storage.upload(file);
}

/**
 * Kling AI Avatar v2 işini KUYRUĞA gönderir (beklemez) → request_id döner.
 * Serverless uyumlu: uzun video üretimini blocklamaz.
 */
export async function submitAvatarJob(
  imageUrl: string,
  audioUrl: string,
  quality: AvatarQuality,
): Promise<string> {
  ensureConfig();
  const { request_id } = await fal.queue.submit(AVATAR_MODELS[quality], {
    input: { image_url: imageUrl, audio_url: audioUrl },
  });
  return request_id;
}

export interface AvatarJobStatus {
  status: "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED" | "ERROR";
  videoUrl?: string;
}

/** Kuyruk işinin durumunu kontrol eder; bittiğinde video URL'sini döner. */
export async function checkAvatarJob(
  requestId: string,
  quality: AvatarQuality,
): Promise<AvatarJobStatus> {
  ensureConfig();
  const model = AVATAR_MODELS[quality];

  const status = await fal.queue.status(model, { requestId });

  if (status.status === "COMPLETED") {
    const result = await fal.queue.result(model, { requestId });
    const videoUrl = (result.data as { video?: { url?: string } })?.video?.url;
    return { status: "COMPLETED", videoUrl };
  }

  if (status.status === "IN_PROGRESS") return { status: "IN_PROGRESS" };
  return { status: "IN_QUEUE" };
}
