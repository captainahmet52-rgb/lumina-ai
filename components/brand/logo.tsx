import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

interface LogoProps {
  className?: string;
  /** Hide the "Creator Studio" sub-label (e.g. collapsed sidebar). */
  compact?: boolean;
  /** Hide the wordmark entirely, showing only the mark. */
  iconOnly?: boolean;
}

/** Lumina AI lockup — violet gradient mark + wordmark (spec §3.1). */
export function Logo({ className, compact, iconOnly }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] text-white shadow-card">
        <Sparkles className="size-5" />
      </div>
      {!iconOnly && (
        <div className="leading-tight">
          <div className="text-[15px] font-bold tracking-tight text-[var(--text)]">
            {APP_NAME}
          </div>
          {!compact && (
            <div className="text-[11px] font-medium text-[var(--muted)]">
              {APP_TAGLINE}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
