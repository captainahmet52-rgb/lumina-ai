/**
 * ElevenLabs — Türkçe metin → ses (text-to-speech).
 * eleven_multilingual_v2 Türkçe'yi destekler.
 */
export async function turkishSpeech(text: string): Promise<Buffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error("ELEVENLABS_API_KEY eksik.");

  const voiceId = process.env.ELEVENLABS_VOICE_ID || "EXAVITQu4vr4xnSDxMaL";

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.4,
          similarity_boost: 0.85,
          style: 0.5,
          use_speaker_boost: true,
        },
      }),
    },
  );

  if (!res.ok) {
    throw new Error(`ElevenLabs hatası (${res.status}): ${await res.text()}`);
  }

  return Buffer.from(await res.arrayBuffer());
}
