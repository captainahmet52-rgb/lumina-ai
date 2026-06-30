"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Generation } from "@/lib/types";
import { GenerationSkeleton } from "@/components/generation/generation-skeleton";
import { GenerationResult } from "@/components/generation/generation-result";
import { GenerationFailed } from "@/components/generation/generation-failed";

/**
 * Subscribes to the `generations` row via Supabase Realtime and swaps between
 * loading / result / failed states as the status changes (spec §6.2).
 * Falls back to light polling in case Realtime replication is misconfigured.
 */
export function GenerationView({ initial }: { initial: Generation }) {
  const [generation, setGeneration] = useState<Generation>(initial);

  useEffect(() => {
    if (generation.status === "completed" || generation.status === "failed") {
      return;
    }

    const supabase = createClient();

    const channel = supabase
      .channel(`generation:${initial.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "generations",
          filter: `id=eq.${initial.id}`,
        },
        (payload) => {
          setGeneration(payload.new as Generation);
        },
      )
      .subscribe();

    // Safety-net poll (every 5s) until terminal state.
    const poll = setInterval(async () => {
      const { data } = await supabase
        .from("generations")
        .select("*")
        .eq("id", initial.id)
        .maybeSingle();
      if (data) setGeneration(data as Generation);
    }, 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(poll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial.id, generation.status]);

  if (generation.status === "completed") {
    return <GenerationResult generation={generation} />;
  }
  if (generation.status === "failed") {
    return <GenerationFailed generation={generation} />;
  }
  const meta = (generation.metadata ?? {}) as Record<string, string>;
  return <GenerationSkeleton prompt={generation.prompt} step={meta.step} />;
}
