// ────────────────────────────────────────────────────────────────
//  Kling + Claude pipeline test (login/tarayıcı gerekmez)
//  Kullanım:
//    node scripts/test-video.mjs <karakter_gorsel_url> <urun_gorsel_url> "<urun adı>" "<video nasıl olsun>"
//  Argüman vermezsen örnek görsellerle çalışır.
// ────────────────────────────────────────────────────────────────

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// .env.local'ı elle yükle
function loadEnv() {
  const envPath = join(__dirname, "..", ".env.local");
  const content = readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}
loadEnv();

// ── Argümanlar / varsayılan örnek görseller ─────────────────────
const [, , argChar, argProduct, argName, argPrompt] = process.argv;

const characterImageUrl =
  argChar ||
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=720&q=80";
const productImageUrl =
  argProduct ||
  "https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=720&q=80";
const productName = argName || "Luxury Rose Perfume 50ml";
const videoPrompt =
  argPrompt ||
  "Mizah içeren, gerçekçi bir UGC video. Karakter sanki arkadaşına anlatıyormuş gibi samimi konuşsun. Elde tutulan telefon, doğal ev ışığı.";

// ── Yardımcılar ─────────────────────────────────────────────────
async function imageToBase64(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Görsel indirilemedi (${res.status}): ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const mime = res.headers.get("content-type") || "image/jpeg";
  return { data: buf.toString("base64"), mime };
}

// ── 1) Claude Haiku ile script üret ─────────────────────────────
async function generateScript(charB64, prodB64) {
  const prompt = `You are an expert UGC video script writer. Create ONE raw 12-second UGC video script.

**USER DIRECTION (follow exactly):**
${videoPrompt}

**PRODUCT:** ${productName}

Image 1 = the CHARACTER (the person in the video). Image 2 = the PRODUCT.
Raw iPhone aesthetic, handheld, no text overlays. The character speaks the dialogue in Turkish.

OUTPUT:
SCRIPT: [angle]
[0:00-0:02] "[opening]"
[0:02-0:09] "[main]"
[0:09-0:12] "[close]"`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: charB64.mime, data: charB64.data } },
            { type: "image", source: { type: "base64", media_type: prodB64.mime, data: prodB64.data } },
            { type: "text", text: prompt },
          ],
        },
      ],
    }),
  });

  if (!res.ok) throw new Error(`Claude hatası: ${await res.text()}`);
  const data = await res.json();
  return data.content.find((c) => c.type === "text")?.text ?? "";
}

// ── 2) Kling ile video üret ─────────────────────────────────────
async function startVideo(script) {
  const res = await fetch("https://api.klingai.com/v1/videos/image2video", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.KLING_API_KEY}`,
    },
    body: JSON.stringify({
      model_name: "kling-v3",
      image: characterImageUrl,
      prompt: script,
      negative_prompt: "blurry, low quality, text overlay, watermark, logo",
      sound: "on",
      mode: "std",
      duration: "10",
    }),
  });

  const raw = await res.text();
  if (!res.ok) throw new Error(`Kling generate hatası (${res.status}): ${raw}`);
  const data = JSON.parse(raw);
  if (data.code !== 0) throw new Error(`Kling: ${data.message} — ${raw}`);
  return data.data.task_id;
}

async function pollVideo(taskId) {
  for (let i = 0; i < 120; i++) {
    await new Promise((r) => setTimeout(r, 10_000));
    const res = await fetch(
      `https://api.klingai.com/v1/videos/image2video/${taskId}`,
      { headers: { Authorization: `Bearer ${process.env.KLING_API_KEY}` } },
    );
    if (!res.ok) continue;
    const data = await res.json();
    const status = data.data?.task_status;
    process.stdout.write(`\r   ⏳ Durum: ${status} (${(i + 1) * 10}sn geçti)      `);
    if (status === "succeed") {
      return data.data.task_result?.videos?.[0]?.url ?? null;
    }
    if (status === "failed") {
      throw new Error(`Video başarısız: ${JSON.stringify(data.data)}`);
    }
  }
  throw new Error("Zaman aşımı (20 dk).");
}

// ── Çalıştır ────────────────────────────────────────────────────
console.log("🎬 Lumina test başlıyor...\n");
console.log("   Karakter:", characterImageUrl);
console.log("   Ürün:", productImageUrl);
console.log("   Ürün adı:", productName);
console.log("");

try {
  console.log("1️⃣  Görseller indiriliyor...");
  const [charB64, prodB64] = await Promise.all([
    imageToBase64(characterImageUrl),
    imageToBase64(productImageUrl),
  ]);

  console.log("2️⃣  Claude Haiku script yazıyor...");
  const script = await generateScript(charB64, prodB64);
  console.log("\n──────── SCRIPT ────────");
  console.log(script);
  console.log("────────────────────────\n");

  console.log("3️⃣  Kling video üretimi başlatılıyor (sound: on)...");
  const taskId = await startVideo(script);
  console.log("   ✅ Task ID:", taskId);

  console.log("4️⃣  Video bekleniyor (2-3 dk)...");
  const videoUrl = await pollVideo(taskId);

  console.log("\n\n✅✅✅ VİDEO HAZIR ✅✅✅");
  console.log("🎥 Video linki:\n", videoUrl);
  console.log("\nBu linki tarayıcıda aç, izle. Karakter konuşuyor mu, Türkçe mi bak.");
} catch (err) {
  console.error("\n\n❌ HATA:", err.message);
  process.exit(1);
}
