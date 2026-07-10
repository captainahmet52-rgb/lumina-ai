// ────────────────────────────────────────────────────────────────
//  HİBRİT test: Claude → Kling(sessiz) → ElevenLabs(TR) → Kling LipSync
//  Kusursuz Türkçe konuşan karakter üretir.
//    node scripts/test-hybrid.mjs [karakter_url] [urun_url] "[urun adı]" "[nasıl olsun]"
// ────────────────────────────────────────────────────────────────

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const content = readFileSync(join(__dirname, "..", ".env.local"), "utf8");
  for (const line of content.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    const v = t.slice(eq + 1).trim();
    if (!process.env[k]) process.env[k] = v;
  }
}
loadEnv();

const KLING = "https://api.klingai.com";
const klingHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${process.env.KLING_API_KEY}`,
});

const [, , argChar, argProduct, argName, argPrompt] = process.argv;
const characterImageUrl =
  argChar || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=720&q=80";
const productImageUrl =
  argProduct || "https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=720&q=80";
const productName = argName || "Luxury Rose Perfume 50ml";
const videoPrompt =
  argPrompt ||
  "Mizah içeren, gerçekçi bir UGC video. Karakter arkadaşına anlatır gibi samimi konuşsun. Elde tutulan telefon, doğal ev ışığı.";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function imageToBase64(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Görsel indirilemedi (${res.status})`);
  const buf = Buffer.from(await res.arrayBuffer());
  return { data: buf.toString("base64"), mime: res.headers.get("content-type") || "image/jpeg" };
}

// 1) Claude: TR konuşma + EN görsel prompt (JSON)
async function generateParts(charB64, prodB64) {
  const instruction = `You write UGC video content. Image 1 = the CHARACTER (person in video). Image 2 = the PRODUCT.

USER DIRECTION: ${videoPrompt}
PRODUCT NAME: ${productName}

Return ONLY a JSON object (no markdown) with exactly these keys:
{
  "spoken_text": "The exact words the character SAYS, in TURKISH. Natural, casual, like a real person. CRITICAL: MUST be VERY short — maximum 16 words, sayable comfortably in UNDER 8 seconds. One or two short punchy sentences only. No stage directions, only spoken words.",
  "visual_prompt": "In ENGLISH: the character facing the camera directly (front-facing selfie), head and shoulders clearly visible and large in frame, calm relaxed expression, minimal head movement, holding the product near their chest. Handheld iPhone selfie, natural soft home lighting, authentic UGC vibe. One paragraph."
}

IMPORTANT: spoken_text over 16 words will break the video. Keep it under 16 words.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: charB64.mime, data: charB64.data } },
            { type: "image", source: { type: "base64", media_type: prodB64.mime, data: prodB64.data } },
            { type: "text", text: instruction },
          ],
        },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Claude hatası: ${await res.text()}`);
  const data = await res.json();
  let text = data.content.find((c) => c.type === "text")?.text ?? "";
  text = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const parsed = JSON.parse(text);
  return { spokenText: parsed.spoken_text, visualPrompt: parsed.visual_prompt };
}

// 2) Kling: sessiz video
async function startVideo(visualPrompt) {
  const res = await fetch(`${KLING}/v1/videos/image2video`, {
    method: "POST",
    headers: klingHeaders(),
    body: JSON.stringify({
      model_name: "kling-v3",
      image: characterImageUrl,
      prompt: visualPrompt,
      negative_prompt: "blurry, low quality, text overlay, watermark, logo, distorted face",
      sound: "off",
      mode: "std",
      duration: "10",
    }),
  });
  const raw = await res.text();
  if (!res.ok) throw new Error(`Kling video hatası (${res.status}): ${raw}`);
  const data = JSON.parse(raw);
  if (data.code !== 0) throw new Error(`Kling: ${data.message}`);
  return data.data.task_id;
}

async function pollVideo(taskId) {
  for (let i = 0; i < 120; i++) {
    await sleep(10_000);
    try {
      const res = await fetch(`${KLING}/v1/videos/image2video/${taskId}`, { headers: klingHeaders() });
      if (!res.ok) continue;
      const data = await res.json();
      const s = data.data?.task_status;
      process.stdout.write(`\r   ⏳ video: ${s} (${(i + 1) * 10}sn)      `);
      if (s === "succeed") {
        const v = data.data.task_result?.videos?.[0];
        return { videoId: v?.id, videoUrl: v?.url };
      }
      if (s === "failed") throw new Error(`Video başarısız: ${JSON.stringify(data.data)}`);
    } catch (e) {
      if (e.message?.includes("başarısız")) throw e;
      process.stdout.write(`\r   ⏳ video: (ağ, tekrar deniyor ${(i + 1) * 10}sn)   `);
    }
  }
  throw new Error("Video zaman aşımı");
}

// 3) ElevenLabs: TR ses → base64 mp3
async function turkishTTS(text) {
  const voiceId = process.env.ELEVENLABS_VOICE_ID || "EXAVITQu4vr4xnSDxMaL";
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.35, use_speaker_boost: true },
      }),
    },
  );
  if (!res.ok) throw new Error(`ElevenLabs hatası (${res.status}): ${await res.text()}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return buf.toString("base64");
}

// 4) Kling Lip Sync
async function startLipSync(videoId, audioB64) {
  const res = await fetch(`${KLING}/v1/videos/lip-sync`, {
    method: "POST",
    headers: klingHeaders(),
    body: JSON.stringify({
      input: {
        mode: "audio2video",
        video_id: videoId,
        audio_type: "file",
        audio_file: audioB64,
      },
    }),
  });
  const raw = await res.text();
  if (!res.ok) throw new Error(`LipSync hatası (${res.status}): ${raw}`);
  const data = JSON.parse(raw);
  if (data.code !== 0) throw new Error(`LipSync: ${data.message} — ${raw}`);
  return data.data.task_id;
}

async function pollLipSync(taskId) {
  for (let i = 0; i < 120; i++) {
    await sleep(10_000);
    try {
      const res = await fetch(`${KLING}/v1/videos/lip-sync/${taskId}`, { headers: klingHeaders() });
      if (!res.ok) continue;
      const data = await res.json();
      const s = data.data?.task_status;
      process.stdout.write(`\r   ⏳ lipsync: ${s} (${(i + 1) * 10}sn)      `);
      if (s === "succeed") return data.data.task_result?.videos?.[0]?.url ?? null;
      if (s === "failed") throw new Error(`LipSync başarısız: ${JSON.stringify(data.data)}`);
    } catch (e) {
      if (e.message?.includes("başarısız")) throw e;
      process.stdout.write(`\r   ⏳ lipsync: (ağ, tekrar deniyor ${(i + 1) * 10}sn)   `);
    }
  }
  throw new Error("LipSync zaman aşımı");
}

// ── Çalıştır ────────────────────────────────────────────────────
console.log("🎬 HİBRİT test başlıyor (Türkçe konuşan karakter)\n");
try {
  console.log("1️⃣  Görseller indiriliyor...");
  const [charB64, prodB64] = await Promise.all([
    imageToBase64(characterImageUrl),
    imageToBase64(productImageUrl),
  ]);

  console.log("2️⃣  Claude → Türkçe konuşma + görsel prompt...");
  const { spokenText, visualPrompt } = await generateParts(charB64, prodB64);
  console.log(`   🗣️  Türkçe (${spokenText.split(/\s+/).length} kelime):`, spokenText);
  console.log("   🎞️  Görsel:", visualPrompt.slice(0, 90) + "...");

  let videoId;
  if (process.env.REUSE_VIDEO_ID) {
    videoId = process.env.REUSE_VIDEO_ID;
    console.log(`\n3️⃣  Mevcut video kullanılıyor (id: ${videoId})`);
  } else {
    console.log("\n3️⃣  Kling sessiz video üretiyor...");
    const vTask = await startVideo(visualPrompt);
    ({ videoId } = await pollVideo(vTask));
    console.log(`\n   ✅ Video hazır (id: ${videoId})`);
  }

  console.log("\n4️⃣  ElevenLabs Türkçe ses üretiyor...");
  const audioB64 = await turkishTTS(spokenText);
  console.log("   ✅ Ses hazır");

  console.log("\n5️⃣  Kling Lip Sync (ağzı Türkçe sese uyduruyor)...");
  const lTask = await startLipSync(videoId, audioB64);
  const finalUrl = await pollLipSync(lTask);

  console.log("\n\n✅✅✅ TÜRKÇE VİDEO HAZIR ✅✅✅");
  console.log("🎥", finalUrl);

  // Masaüstüne indir
  const vid = await fetch(finalUrl);
  const buf = Buffer.from(await vid.arrayBuffer());
  const out = join(process.env.USERPROFILE, "Desktop", "lumina-turkce-test.mp4");
  writeFileSync(out, buf);
  console.log("\n💾 İndirildi:", out);
  console.log("   Çift tıkla izle — Türkçe konuşmalı, dudaklar tutmalı.");
} catch (err) {
  console.error("\n\n❌ HATA:", err.message);
  process.exit(1);
}
