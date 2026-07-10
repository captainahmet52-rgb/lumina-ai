"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, Loader2, Crown, User, Package, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { UploadProduct } from "@/components/dashboard/upload-product";

interface CreateContentProps {
  userId: string;
  plan: "free" | "pro";
  credits: number;
}

export function CreateContent({ userId, plan, credits }: CreateContentProps) {
  const router = useRouter();

  const [characterImageUrl, setCharacterImageUrl] = useState<string | null>(null);
  const [productImageUrl, setProductImageUrl] = useState<string | null>(null);
  const [productName, setProductName] = useState("");
  const [videoPrompt, setVideoPrompt] = useState("");
  const [seconds, setSeconds] = useState(15);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upgradeNeeded, setUpgradeNeeded] = useState(false);

  const outOfCredits = plan === "free" && credits <= 0;
  const canGenerate =
    !!characterImageUrl &&
    !!productImageUrl &&
    productName.trim().length >= 2 &&
    videoPrompt.trim().length >= 5 &&
    !outOfCredits;

  async function onGenerate() {
    if (!canGenerate) return;
    setSubmitting(true);
    setError(null);
    setUpgradeNeeded(false);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          character_image_url: characterImageUrl,
          product_image_url: productImageUrl,
          product_name: productName.trim(),
          video_prompt: videoPrompt.trim(),
          seconds,
        }),
      });

      const data = await res.json();

      if (res.status === 402) {
        setUpgradeNeeded(true);
        setError(data.error || "Krediniz bitti. Pro plana geçin.");
        return;
      }
      if (!res.ok) {
        setError(data.error || "Bir hata oluştu. Tekrar dene.");
        return;
      }

      router.push(`/my-content/${data.generation_id}`);
    } catch {
      setError("Bağlantı hatası. Tekrar dene.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {outOfCredits && (
        <Card className="border-[var(--primary)]/30 bg-[var(--primary)]/5">
          <CardContent className="flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--primary)]/15 text-[var(--primary)]">
                <Crown className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">Krediniz bitti</p>
                <p className="text-sm text-[var(--muted)]">
                  Sınırsız video için Pro plana geçin.
                </p>
              </div>
            </div>
            <Button asChild>
              <Link href="/payments">Pro&apos;ya Geç</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* İki görsel yükleme */}
      <div className="grid gap-5 sm:grid-cols-2">
        {/* Karakter Görseli */}
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                <User className="size-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold">Karakter Görseli</h2>
                <p className="text-xs text-[var(--muted)]">
                  Video&apos;da görünecek kişi
                </p>
              </div>
            </div>
            <UploadProduct
              userId={userId}
              value={characterImageUrl}
              onChange={setCharacterImageUrl}
              bucket="characters"
            />
          </CardContent>
        </Card>

        {/* Ürün Görseli */}
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <Package className="size-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold">Ürün Görseli</h2>
                <p className="text-xs text-[var(--muted)]">
                  Tanıtılacak ürün (transparan PNG)
                </p>
              </div>
            </div>
            <UploadProduct
              userId={userId}
              value={productImageUrl}
              onChange={setProductImageUrl}
              bucket="products"
            />
          </CardContent>
        </Card>
      </div>

      {/* Video Detayları */}
      <Card>
        <CardContent className="space-y-5 p-5">
          <div>
            <h2 className="text-base font-semibold">Video Detayları</h2>
            <p className="text-sm text-[var(--muted)]">
              Ürün adını ve videonun nasıl olmasını istediğini yaz.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="product-name">Ürün Adı</Label>
            <Input
              id="product-name"
              placeholder="Örn: Luxury Rose Perfume 50ml"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="video-prompt">Video Nasıl Olsun?</Label>
            <Textarea
              id="video-prompt"
              placeholder="Örn: Mizah içeren, gerçekçi bir video olsun. Sanki arkadaşına anlatıyor gibi konuşsun. Mutfakta çekilmiş gibi görünsün."
              value={videoPrompt}
              onChange={(e) => setVideoPrompt(e.target.value)}
              className="min-h-[100px]"
            />
            <p className="text-xs text-[var(--muted)]">
              Ne kadar detaylı yazarsan video o kadar istendiği gibi çıkar.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Video Süresi</Label>
            <div className="grid grid-cols-3 gap-2">
              {[15, 30, 45].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSeconds(s)}
                  className={
                    seconds === s
                      ? "rounded-xl border border-[var(--primary)] bg-[var(--primary)]/10 px-3 py-2.5 text-sm font-semibold text-[var(--primary)]"
                      : "rounded-xl border border-[var(--border)] bg-white px-3 py-2.5 text-sm font-medium text-[var(--muted)] transition-colors hover:border-[var(--primary)]/40"
                  }
                >
                  {s} sn
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}{" "}
              {upgradeNeeded && (
                <Link href="/payments" className="font-semibold underline">
                  Şimdi geç
                </Link>
              )}
            </p>
          )}

          <Button
            size="xl"
            className="w-full"
            onClick={onGenerate}
            disabled={!canGenerate || submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="size-5 animate-spin" /> Başlatılıyor…
              </>
            ) : (
              <>
                <Sparkles className="size-5" /> Video Oluştur
              </>
            )}
          </Button>

          {(!characterImageUrl || !productImageUrl) && (
            <p className="text-center text-xs text-[var(--muted)]">
              {!characterImageUrl && !productImageUrl
                ? "Karakter ve ürün görselini yükle."
                : !characterImageUrl
                  ? "Karakter görselini yükle."
                  : "Ürün görselini yükle."}
            </p>
          )}

          {/* Bilgi notu */}
          <div className="flex items-start gap-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] px-4 py-3">
            <Info className="mt-0.5 size-4 shrink-0 text-[var(--primary)]" />
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              <span className="font-semibold text-[var(--text)]">İpucu:</span>{" "}
              Ürün görselini ne kadar yüksek kaliteli yüklersen ve video
              açıklamasını ne kadar detaylı yazarsan, çıkan video o kadar
              gerçekçi ve etkili olur. Transparan arka planlı PNG görseller en
              iyi sonucu verir.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
