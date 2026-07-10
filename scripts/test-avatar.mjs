// ────────────────────────────────────────────────────────────────
//  YENİ mimari test: Claude → ElevenLabs → Kling AI Avatar v2 (fal.ai)
//  Kling kalitesi + Türkçe + uzun + iyi lip sync
//    node scripts/test-avatar.mjs [karakter_url] "[urun adı]" "[nasıl olsun]"
// ────────────────────────────────────────────────────────────────

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { fal } from "@fal-ai/client";

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

fal.config({ credentials: process.env.FAL_KEY });

const [, , argChar, argName, argPrompt] = process.argv;
const characterImageUrl =
  argChar || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=720&q=80";
const productName = argName || "Luxury Rose Perfume";
const videoPrompt =
  argPrompt || "Mizah içeren, samimi bir UGC reklam. Arkadaşına anlatır gibi doğal konuşsun.";

// 1) Claude → Türkçe konuşma (~18-20 saniye)
async function generateSpeech(charB64) {
  const instruction = `You write UGC ad scripts. The image is the CHARACTER who will speak.

USER DIRECTION: ${videoPrompt}
PRODUCT: ${productName}

Write what the character SAYS out loud, in TURKISH. Natural, casual, like a real person doing a UGC ad for their phone. Around 40-50 words (about 18-20 seconds of speech). Only the spoken words, no stage directions, no quotes. Make it engaging and authentic.`;

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
            { type: "text", text: instruction },
          ],
        },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Claude hatası: ${await res.text()}`);
  const data = await res.json();
  return (data.content.find((c) => c.type === "text")?.text ?? "").trim();
}

// 2) ElevenLabs → Türkçe ses (doğal ayar)
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
        voice_settings: { stability: 0.4, similarity_boost: 0.85, style: 0.5, use_speaker_boost: true },
      }),
    },
  );
  if (!res.ok) throw new Error(`ElevenLabs hatası (${res.status}): ${await res.text()}`);
  return Buffer.from(await res.arrayBuffer());
}

async function imageToBase64(url) {
  const res = await fetch(url);
  const buf = Buffer.from(await res.arrayBuffer());
  return { data: buf.toString("base64"), mime: res.headers.get("content-type") || "image/jpeg" };
}

// ── Çalıştır ────────────────────────────────────────────────────
console.log("🎬 Kling AI Avatar v2 testi (Kling kalitesi + Türkçe)\n");
try {
  console.log("1️⃣  Karakter görseli indiriliyor...");
  const charB64 = await imageToBase64(characterImageUrl);

  console.log("2️⃣  Claude → Türkçe konuşma yazıyor...");
  const speech = await generateSpeech(charB64);
  console.log(`   🗣️  (${speech.split(/\s+/).length} kelime):`, speech, "\n");

  console.log("3️⃣  ElevenLabs → Türkçe ses üretiyor...");
  const audioBuf = await turkishTTS(speech);
  console.log(`   ✅ Ses hazır (${(audioBuf.length / 1024).toFixed(0)} KB)`);

  console.log("4️⃣  Ses fal.ai'ye yükleniyor...");
  const audioFile = new File([audioBuf], "speech.mp3", { type: "audio/mpeg" });
  const audioUrl = await fal.storage.upload(audioFile);
  console.log("   ✅ Yüklendi");

  console.log("5️⃣  Kling AI Avatar v2 video üretiyor (2-4 dk)...");
  const result = await fal.subscribe("fal-ai/kling-video/ai-avatar/v2/pro", {
    input: { image_url: characterImageUrl, audio_url: audioUrl },
    logs: true,
    onQueueUpdate: (u) => {
      if (u.status === "IN_PROGRESS") process.stdout.write(`\r   ⏳ üretiliyor...      `);
    },
  });

  const videoUrl = result.data?.video?.url;
  if (!videoUrl) throw new Error("Video URL gelmedi: " + JSON.stringify(result.data));

  console.log("\n\n✅✅✅ VİDEO HAZIR ✅✅✅");
  console.log("🎥", videoUrl);

  const vid = await fetch(videoUrl);
  const out = join(process.env.USERPROFILE, "Desktop", "lumina-avatar-test.mp4");
  writeFileSync(out, Buffer.from(await vid.arrayBuffer()));
  console.log("\n💾 İndirildi:", out);
  console.log("   İzle — Kling kalitesi mi, Türkçe mi, dudak tutuyor mu?");
} catch (err) {
  console.error("\n\n❌ HATA:", err.message);
  if (err.body) console.error(JSON.stringify(err.body, null, 2));
  process.exit(1);
}
