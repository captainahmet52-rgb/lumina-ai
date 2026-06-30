import Link from "next/link";
import { Search, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Profile } from "@/lib/types";

interface TopbarProps {
  profile: Pick<Profile, "plan" | "credits">;
  /** Optional search placeholder override per screen. */
  searchPlaceholder?: string;
}

/** Sticky content-area header with the search bar (spec §3.2). */
export function Topbar({
  profile,
  searchPlaceholder = "Search assets, concepts, or inspiration...",
}: TopbarProps) {
  const isPro = profile.plan === "pro";

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-[var(--border)] bg-[var(--bg)]/80 px-4 py-3.5 backdrop-blur sm:px-8">
      <div className="relative max-w-xl flex-1">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" />
        <input
          type="search"
          placeholder={searchPlaceholder}
          className="h-11 w-full rounded-xl border border-[var(--border)] bg-white pl-10 pr-4 text-sm text-[var(--text)] placeholder:text-[var(--muted)] shadow-sm focus-visible:border-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/20"
        />
      </div>

      <div className="ml-auto flex items-center gap-3">
        {isPro ? (
          <Badge variant="default" className="hidden sm:inline-flex">
            <Zap className="size-3.5" /> Creator Pro
          </Badge>
        ) : (
          <>
            <Badge variant="muted" className="hidden sm:inline-flex">
              {profile.credits} credits left
            </Badge>
            <Button asChild size="sm">
              <Link href="/payments">
                <Zap className="size-4" /> Upgrade
              </Link>
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
