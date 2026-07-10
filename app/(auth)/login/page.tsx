import Link from "next/link";
import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { GoogleButton } from "@/components/auth/google-button";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Giriş Yap" };

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
          <h1 className="text-2xl font-bold tracking-tight">Tekrar hoş geldin</h1>
          <p className="text-sm text-[var(--muted)]">
            Stüdyona erişmek için bilgilerini gir.
          </p>
        </div>

        <GoogleButton next={redirectedFrom} />

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-[var(--border)]" />
          <span className="text-[11px] font-semibold tracking-wider text-[var(--muted)]">
            VEYA E-POSTA
          </span>
          <div className="h-px flex-1 bg-[var(--border)]" />
        </div>

        <LoginForm next={redirectedFrom} />

        <p className="text-center text-sm text-[var(--muted)]">
          Lumina AI&apos;da yeni misin?{" "}
          <Link
            href="/signup"
            className="font-semibold text-[var(--primary)] hover:underline"
          >
            Ücretsiz hesap oluştur
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
