import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Crown, Zap, LogOut } from "lucide-react";
import { getSessionProfile } from "@/lib/data/profile";
import { Topbar } from "@/components/app/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProfileForm } from "@/components/settings/profile-form";
import { signOut } from "@/app/auth/actions";
import { FREE_PLAN_CREDITS } from "@/lib/constants";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await getSessionProfile();
  if (!session) redirect("/login");

  const { user, profile } = session;
  const isPro = profile.plan === "pro";

  return (
    <>
      <Topbar profile={profile} searchPlaceholder="Search settings…" />
      <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-7 sm:px-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Manage your profile and subscription.
          </p>
        </div>

        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileForm
              userId={user.id}
              initialName={profile.full_name ?? ""}
              email={profile.email ?? user.email ?? ""}
            />
          </CardContent>
        </Card>

        {/* Plan */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
                  {isPro ? <Crown className="size-5" /> : <Zap className="size-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">
                      {isPro ? "Creator Pro" : "Free plan"}
                    </p>
                    <Badge variant={isPro ? "default" : "muted"}>
                      {profile.subscription_status}
                    </Badge>
                  </div>
                  <p className="text-sm text-[var(--muted)]">
                    {isPro
                      ? "Unlimited generations · commercial rights · 4K exports"
                      : `${profile.credits} of ${FREE_PLAN_CREDITS} trial credits remaining`}
                  </p>
                </div>
              </div>
              {!isPro && (
                <Button asChild>
                  <Link href="/payments">Upgrade</Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Account */}
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={signOut}>
              <Button type="submit" variant="outline">
                <LogOut className="size-4" /> Sign out
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
