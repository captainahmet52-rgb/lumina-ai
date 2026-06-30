"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Download,
  RefreshCw,
  Loader2,
  Film,
  History,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Generation } from "@/lib/types";

function triggerDownload(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function GenerationResult({ generation }: { generation: Generation }) {
  const router = useRouter();
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const videoUrl = generation.video_url;
  const meta = (generation.metadata ?? {}) as Record<string, string>;

  async function tryAgain() {
    setRetrying(true);
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          character_image_url: meta.character_image_url,
          product_image_url: generation.product_image_url,
          product_name: meta.product_name ?? generation.prompt,
          video_prompt: generation.prompt,
        }),
      });
      const data = await res.json();
      if (res.status === 402) {
        router.push("/payments");
        return;
      }
      if (!res.ok) {
        setError(data.error || "Bir hata oluştu.");
        return;
      }
      router.push(`/my-content/${data.generation_id}`);
    } catch {
      setError("Bağlantı hatası. Tekrar dene.");
    } finally {
      setRetrying(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Badge variant="success" className="w-fit">
            <CheckCircle2 className="size-3.5" /> Tamamlandı
          </Badge>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Video Hazır!
          </h1>
          <p className="max-w-2xl text-sm text-[var(--muted)]">
            <strong>Ürün:</strong> {meta.product_name ?? generation.prompt}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="secondary" onClick={tryAgain} disabled={retrying}>
            {retrying ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            Tekrar Üret
          </Button>
          {videoUrl && (
            <Button onClick={() => triggerDownload(videoUrl, "lumina-video.mp4")}>
              <Download className="size-4" /> İndir
            </Button>
          )}
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {/* Video */}
      {videoUrl ? (
        <Card className="overflow-hidden">
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center gap-2">
              <Film className="size-4 text-[var(--primary)]" />
              <h3 className="text-sm font-semibold">UGC Video</h3>
            </div>
            <video
              controls
              playsInline
              autoPlay
              className="mx-auto aspect-[9/16] max-h-[600px] w-full rounded-xl bg-black object-contain"
              src={videoUrl}
            />
            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              onClick={() => triggerDownload(videoUrl, "lumina-video.mp4")}
            >
              <Download className="size-4" /> Videoyu İndir
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-sm text-[var(--muted)]">
            Video URL&apos;si bulunamadı.
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button asChild variant="ghost" size="sm">
          <Link href="/my-content">
            <History className="size-4" /> Tüm Geçmiş
          </Link>
        </Button>
      </div>
    </div>
  );
}
