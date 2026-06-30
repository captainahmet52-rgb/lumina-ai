import Link from "next/link";
import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { GoogleButton } from "@/components/auth/google-button";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectedFrom?: string }>;
}) {
  const { redirectedFrom } = await searchParams;

  return (
    <Card className="shadow-card-lg">
      <CardContent className="space-y-6 p-7 sm:p-8">
        <div className="space-y-1.5 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-sm text-[var(--muted)]">
            Enter your details to access your studio.
          </p>
        </div>

        <GoogleButton next={redirectedFrom} />

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-[var(--border)]" />
          <span className="text-[11px] font-semibold tracking-wider text-[var(--muted)]">
            OR EMAIL
          </span>
          <div className="h-px flex-1 bg-[var(--border)]" />
        </div>

        <LoginForm next={redirectedFrom} />

        <p className="text-center text-sm text-[var(--muted)]">
          New to Lumina AI?{" "}
          <Link
            href="/signup"
            className="font-semibold text-[var(--primary)] hover:underline"
          >
            Create a free account
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
