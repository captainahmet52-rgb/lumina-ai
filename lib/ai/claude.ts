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

/** İstenen video süresine göre yaklaşık kelime sayısı (~2.1 kelime/sn). */
function wordTarget(seconds: number): number {
  return Math.round(seconds * 2.1);
}

export interface SpeechInput {
  characterImageUrl: string;
  productImageUrl: string;
  productName: string;
  videoPrompt: string;
  seconds: number;
}

export interface SpeechResult {
  /** Karakterin görünen cinsiyeti — ses seçimi için. */
  gender: "male" | "female";
  /** Karakterin söyleyeceği Türkçe metin (ElevenLabs v3 ses etiketleri dahil). */
  text: string;
}

/**
 * Claude Haiku — karakter + ürün görselini görür, kullanıcının istediği tarza
 * göre karakterin söyleyeceği TÜRKÇE konuşma metnini üretir.
 * Gerçek bir insanın telefonuna çektiği video gibi: dolgu kelimeleri,
 * yarım cümleler, doğal duraksamalar. Reklam dili YASAK.
 * Ayrıca karakterin cinsiyetini döner (doğru sesi seçmek için).
 */
export async function generateTurkishSpeech(
  input: SpeechInput,
): Promise<SpeechResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY eksik.");

  const [character, product] = await Promise.all([
    imageToBase64(input.characterImageUrl),
    imageToBase64(input.productImageUrl),
  ]);

  const words = wordTarget(input.seconds);

  const instruction = `Görsel 1 = videoda konuşacak KARAKTER. Görsel 2 = tanıtılacak ÜRÜN.

KULLANICININ İSTEĞİ (buna birebir uy): ${input.videoPrompt}
ÜRÜN ADI: ${input.productName}

GÖREV: Bu karakterin telefon kamerasına konuşurken söyleyeceği TÜRKÇE metni yaz. Bu bir reklam DEĞİL — bir arkadaşına ürünü anlatan gerçek bir insan videosu.

GERÇEK İNSAN GİBİ YAZ — kurallar:
- Konuşma dili kullan: "ya", "yani", "bak şimdi", "cidden", "vallahi", "falan" gibi dolgu ifadeleri DOĞAL yerlerde kullan (her cümlede değil, gerçek insanlar gibi ara ara)
- Yarım cümleler, kendi kendini düzeltmeler serbest: "İki haftadır... yok üç hafta oldu galiba kullanıyorum"
- Kişisel mini hikâye kur: nereden duydu, ilk izlenimi neydi, ne değişti
- Kusur/şüphe ekle, %100 övgü YAPMA: "önce inanmadım açıkçası", "fiyatı biraz tuzlu ama"
- Devrik cümle serbest: "Çok iyi geldi bana bu ya"

KESİNLİKLE YASAK (yapay zekâ/reklam kokan ifadeler):
- "kesinlikle tavsiye ederim", "hayatımı değiştirdi", "devrim niteliğinde"
- "mükemmel", "muhteşem", "harika bir ürün", "kaçırmayın", "denemelisiniz"
- Ürün özelliklerini liste gibi saymak
- Kusursuz, düzgün kurulmuş uzun cümleler

SES ETİKETLERİ (ElevenLabs v3): Metnin içine EN FAZLA 2-3 tane, doğal anlarda köşeli parantezle İngilizce etiket koy: [laughs] (gülme), [sighs] (iç çekme), [exhales] (nefes verme). Örnek: "Önce dedim ki yok artık [laughs] ama cidden işe yarıyor ya."

UZUNLUK: yaklaşık ${words} kelime (~${input.seconds} saniyelik doğal konuşma). Etiketler kelime sayılmaz.

ÇIKTI FORMATI — tam olarak şöyle, kod bloğu/açıklama YOK:
İlk satır: CINSIYET: erkek  (veya  CINSIYET: kadin — Görsel 1'deki karakterin görünen cinsiyeti)
Sonraki satırlar: sadece söylenecek Türkçe konuşma metni.`;

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
  const raw = data.content.find((c) => c.type === "text")?.text ?? "";

  return parseSpeechResult(raw);
}

/**
 * Claude çıktısını ayıklar. Beklenen format:
 *   CINSIYET: erkek|kadin
 *   <konuşma metni>
 * Format bozulsa bile konuşma metnini kurtarır (kod bloğu vb. temizler).
 */
function parseSpeechResult(raw: string): SpeechResult {
  // Olası kod bloklarını temizle.
  let cleaned = raw.replace(/```[a-z]*\n?/gi, "").trim();

  let gender: SpeechResult["gender"] = "female";
  const genderMatch = cleaned.match(
    /^\s*(?:CINSIYET|CİNSİYET|GENDER)\s*[:=]\s*(erkek|kadin|kadın|male|female)\s*/im,
  );
  if (genderMatch) {
    const g = genderMatch[1].toLowerCase();
    gender = g === "erkek" || g === "male" ? "male" : "female";
    // Cinsiyet satırını metinden çıkar.
    cleaned = cleaned.replace(genderMatch[0], "").trim();
  }

  if (!cleaned) throw new Error("Claude boş metin döndürdü.");
  return { gender, text: cleaned };
}
