import { Loader2, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface GenerationSkeletonProps {
  prompt?: string;
  step?: string;
}

export function GenerationSkeleton({ prompt, step }: GenerationSkeletonProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3">
        <Badge variant="warning" className="w-fit">
          <Loader2 className="size-3.5 animate-spin" /> Üretiliyor
        </Badge>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Sparkles className="size-6 text-[var(--primary)]" />
          Videolar hazırlanıyor…
        </h1>
        {step && (
          <p className="text-sm font-medium text-[var(--primary)]">{step}</p>
        )}
        {prompt && (
          <p className="max-w-2xl text-sm text-[var(--muted)]">
            <strong>İstek:</strong> {prompt}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="overflow-hidden">
            <Skeleton className="aspect-[9/16] w-full rounded-none" />
            <CardContent className="p-3">
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-center text-sm text-[var(--muted)]">
        Video üretimi 2-3 dakika sürebilir. Bu sayfada kal, videolar hazır
        olunca otomatik belirecek.
      </p>
    </div>
  );
}
