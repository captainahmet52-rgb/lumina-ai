import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="bg-aurora flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center">
      <Logo />
      <div className="space-y-2">
        <h1 className="text-5xl font-bold tracking-tight text-[var(--primary)]">
          404
        </h1>
        <p className="text-sm text-[var(--muted)]">
          We couldn&apos;t find that page.
        </p>
      </div>
      <Button asChild>
        <Link href="/dashboard">Back to Studio</Link>
      </Button>
    </div>
  );
}
