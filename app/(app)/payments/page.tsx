import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/data/profile";
import { Topbar } from "@/components/app/topbar";
import { UpgradePanel } from "@/components/payments/upgrade-panel";

export const metadata: Metadata = { title: "Kredi Satın Al" };

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await getSessionProfile();
  if (!session) redirect("/login");

  const { status } = await searchParams;
  const normalizedStatus =
    status === "success" || status === "cancelled" ? status : undefined;

  return (
    <>
      <Topbar
        profile={session.profile}
        searchPlaceholder="Plan ve faturalarda ara…"
      />
      <div className="mx-auto w-full max-w-5xl space-y-7 px-4 py-7 sm:px-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Video Kredisi Satın Al
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            1 kredi = 1 video. Sana uygun paketi seç, kredin bittiğinde yükle.
          </p>
        </div>

        <UpgradePanel credits={session.profile.credits} status={normalizedStatus} />
      </div>
    </>
  );
}
