import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, Loader2, AlertTriangle, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Generation } from "@/lib/types";
import { STYLE_PRESETS } from "@/lib/constants";

function styleLabel(value: string) {
  return STYLE_PRESETS.find((s) => s.value === value)?.label ?? value;
}

function StatusBadge({ status }: { status: Generation["status"] }) {
  if (status === "completed") {
    return (
      <Badge variant="success">
        <CheckCircle2 className="size-3" /> Tamamlandı
      </Badge>
    );
  }
  if (status === "failed") {
    return (
      <Badge variant="danger">
        <AlertTriangle className="size-3" /> Başarısız
      </Badge>
    );
  }
  return (
    <Badge variant="warning">
      <Loader2 className="size-3 animate-spin" /> Üretiliyor
    </Badge>
  );
}

/** A single generation tile in the My Content grid. */
export function ContentCard({ generation }: { generation: Generation }) {
  const thumb =
    generation.image_urls?.[0] ?? generation.product_image_url;
  const hasVideo = !!generation.video_url;

  return (
    <Link
      href={`/my-content/${generation.id}`}
      className="group block overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-card transition-shadow hover:shadow-card-lg"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[var(--bg)]">
        <Image
          src={thumb}
          alt={generation.prompt}
          fill
          sizes="(max-width: 640px) 100vw, 33vw"
          className="object-contain transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute left-3 top-3">
          <StatusBadge status={generation.status} />
        </div>
        {hasVideo && (
          <div className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-white/90 text-[var(--primary)] shadow-card">
            <Play className="size-4" />
          </div>
        )}
      </div>
      <div className="space-y-1.5 p-4">
        <p className="line-clamp-2 text-sm font-medium text-[var(--text)]">
          {generation.prompt}
        </p>
        <div className="flex items-center justify-between text-xs text-[var(--muted)]">
          <span>{styleLabel(generation.style_preset)}</span>
          <span>
            {new Date(generation.created_at).toLocaleDateString("tr-TR", {
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      </div>
    </Link>
  );
}
