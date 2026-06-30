import Link from "next/link";
import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { GoogleButton } from "@/components/auth/google-button";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = { title: "Create account" };

export default function SignupPage() {
  return (
    <Card className="shadow-card-lg">
      <CardContent className="space-y-6 p-7 sm:p-8">
        <div className="space-y-1.5 text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            Create your studio
          </h1>
          <p className="text-sm text-[var(--muted)]">
            Start generating cinematic content in minutes.
          </p>
        </div>

        <GoogleButton />

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-[var(--border)]" />
          <span className="text-[11px] font-semibold tracking-wider text-[var(--muted)]">
            OR EMAIL
          </span>
          <div className="h-px flex-1 bg-[var(--border)]" />
        </div>

        <SignupForm />

        <p className="text-center text-sm text-[var(--muted)]">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-[var(--primary)] hover:underline"
          >
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
