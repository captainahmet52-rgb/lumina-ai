const BASE_URL = "https://api.klingai.com";

function authHeaders() {
  const key = process.env.KLING_API_KEY;
  if (!key) throw new Error("KLING_API_KEY eksik.");
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

type KlingTaskResponse = {
  code: number;
  message: string;
  data: {
    task_id: string;
    task_status: string;
    task_result?: {
      videos?: { id: string; url: string; duration: string }[];
    };
  };
};

export async function startVideoGeneration(
  prompt: string,
  characterImageUrl: string,
): Promise<string> {
  const res = await fetch(`${BASE_URL}/v1/videos/image2video`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      model_name: "kling-v3-omni",
      image: characterImageUrl,
      prompt,
      negative_prompt: "blurry, low quality, text overlay, watermark, logo",
      cfg_scale: 0.5,
      mode: "std",
      duration: "15",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Kling generate hatası: ${err}`);
  }

  const data = (await res.json()) as KlingTaskResponse;
  if (data.code !== 0) throw new Error(`Kling hatası: ${data.message}`);

  return data.data.task_id;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function pollUntilComplete(taskId: string): Promise<string | null> {
  const MAX_ATTEMPTS = 120;

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    await sleep(10_000);

    const res = await fetch(`${BASE_URL}/v1/videos/image2video/${taskId}`, {
      headers: authHeaders(),
    });

    if (!res.ok) continue;

    const data = (await res.json()) as KlingTaskResponse;

    if (data.data.task_status === "succeed") {
      return data.data.task_result?.videos?.[0]?.url ?? null;
    }
    if (data.data.task_status === "failed") return null;
  }

  return null;
}
