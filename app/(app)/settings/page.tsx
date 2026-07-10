import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Video, LogOut } from "lucide-react";
import { getSessionProfile } from "@/lib/data/profile";
import { Topbar } from "@/components/app/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProfileForm } from "@/components/settings/profile-form";
import { signOut } from "@/app/auth/actions";

export const metadata: Metadata = { title: "Ayarlar" };

export default async function SettingsPage() {
  const session = await getSessionProfile();
  if (!session) redirect("/login");

  const { user, profile } = session;

  return (
    <>
      <Topbar profile={profile} searchPlaceholder="Ayarlarda ara…" />
      <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-7 sm:px-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ayarlar</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Profilini ve kredilerini yönet.
          </p>
        </div>

        {/* Profil */}
        <Card>
          <CardHeader>
            <CardTitle>Profil</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileForm
              userId={user.id}
              initialName={profile.full_name ?? ""}
              email={profile.email ?? user.email ?? ""}
            />
          </CardContent>
        </Card>

        {/* Krediler */}
        <Card>
          <CardHeader>
            <CardTitle>Krediler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
                  <Video className="size-5" />
                </div>
                <div>
                  <p className="font-semibold">{profile.credits} video kredisi</p>
                  <p className="text-sm text-[var(--muted)]">
                    1 kredi = 1 video. Kredin bittiğinde yeni paket alabilirsin.
                  </p>
                </div>
              </div>
              <Button asChild>
                <Link href="/payments">Kredi Al</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Hesap */}
        <Card>
          <CardHeader>
            <CardTitle>Hesap</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={signOut}>
              <Button type="submit" variant="outline">
                <LogOut className="size-4" /> Çıkış Yap
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
