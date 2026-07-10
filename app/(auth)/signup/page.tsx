import Link from "next/link";
import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { GoogleButton } from "@/components/auth/google-button";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = { title: "Hesap Oluştur" };

export default function SignupPage() {
  return (
    <Card className="shadow-card-lg">
      <CardContent className="space-y-6 p-7 sm:p-8">
        <div className="space-y-1.5 text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            Stüdyonu oluştur
          </h1>
          <p className="text-sm text-[var(--muted)]">
            Dakikalar içinde sinematik içerik üretmeye başla.
          </p>
        </div>

        <GoogleButton />

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-[var(--border)]" />
          <span className="text-[11px] font-semibold tracking-wider text-[var(--muted)]">
            VEYA E-POSTA
          </span>
          <div className="h-px flex-1 bg-[var(--border)]" />
        </div>

        <SignupForm />

        <p className="text-center text-sm text-[var(--muted)]">
          Zaten hesabın var mı?{" "}
          <Link
            href="/login"
            className="font-semibold text-[var(--primary)] hover:underline"
          >
            Giriş yap
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
