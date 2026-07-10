"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, RefreshCw, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Generation } from "@/lib/types";

/** Failed generation state with a "Try Again" re-run (spec §6.2). */
export function GenerationFailed({ generation }: { generation: Generation }) {
  const router = useRouter();
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function tryAgain() {
    setRetrying(true);
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_image_url: generation.product_image_url,
          prompt: generation.prompt,
          style_preset: generation.style_preset,
          aspect_ratio: generation.aspect_ratio,
        }),
      });
      const data = await res.json();
      if (res.status === 402) {
        router.push("/payments");
        return;
      }
      if (!res.ok) {
        setError(data.error || "Yeni üretim başlatılamadı.");
        return;
      }
      router.push(`/my-content/${data.generation_id}`);
    } catch {
      setError("Bağlantı hatası. Lütfen tekrar dene.");
    } finally {
      setRetrying(false);
    }
  }

  return (
    <div className="space-y-6">
      <Badge variant="danger" className="w-fit">
        <AlertTriangle className="size-3.5" /> Üretim Başarısız
      </Badge>

      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
            <AlertTriangle className="size-7" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-bold">Bir şeyler ters gitti</h1>
            <p className="max-w-md text-sm text-[var(--muted)]">
              {generation.error ||
                "Lumina bu videoyu tamamlayamadı. Kredin korundu — tekrar deneyebilirsin."}
            </p>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button onClick={tryAgain} disabled={retrying}>
            {retrying ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            Tekrar Dene
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
