import * as React from "react";
import { cn } from "@/lib/utils";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  name?: string | null;
}

function initialsFrom(name?: string | null) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "U").concat(parts[1]?.[0] ?? "").toUpperCase();
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, name, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--primary)]/10 text-xs font-semibold text-[var(--primary)]",
        className,
      )}
      {...props}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name ?? "Avatar"} className="size-full object-cover" />
      ) : (
        initialsFrom(name)
      )}
    </div>
  ),
);
Avatar.displayName = "Avatar";

export { Avatar };
