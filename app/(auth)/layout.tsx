import type { ReactNode } from "react";
import { Logo } from "@/components/brand/logo";

/** Centered auth shell with the subtle violet aurora backdrop (spec §3.1). */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-aurora flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div className="mb-8 flex flex-col items-center gap-3">
        <Logo />
      </div>
      <div className="w-full max-w-md">{children}</div>
      <p className="mt-8 text-center text-xs text-[var(--muted)]">
        © {new Date().getFullYear()} Lumina AI · Crafted for creators
      </p>
    </div>
  );
}
