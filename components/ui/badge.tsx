import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-[var(--primary)]/10 text-[var(--primary)]",
        success: "bg-emerald-500/12 text-emerald-600",
        warning: "bg-amber-500/12 text-amber-600",
        danger: "bg-red-500/12 text-red-600",
        muted: "bg-[var(--border)] text-[var(--muted)]",
        outline: "border border-[var(--border)] text-[var(--text)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
