import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/data/profile";
import { Topbar } from "@/components/app/topbar";
import { CreateContent } from "@/components/dashboard/create-content";
import { CommunityInspiration } from "@/components/dashboard/community-inspiration";

export const metadata: Metadata = { title: "Yeni İçerik Oluştur" };

export default async function DashboardPage() {
  const session = await getSessionProfile();
  if (!session) redirect("/login");

  const { user, profile } = session;

  return (
    <>
      <Topbar profile={profile} />
      <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-7 sm:px-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Yeni İçerik Oluştur
          </h1>
          <p className="mt-1 text-sm text-muted">
            Ürün görselini yükle, ürün adını yaz, Lumina videoyu oluştursun.
          </p>
        </div>

        <CreateContent
          userId={user.id}
          plan={profile.plan}
          credits={profile.credits}
        />

        <CommunityInspiration />
      </div>
    </>
  );
}
