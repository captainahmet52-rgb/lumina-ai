import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/data/profile";
import { Topbar } from "@/components/app/topbar";
import { UpgradePanel } from "@/components/payments/upgrade-panel";

export const metadata: Metadata = { title: "Upgrade to Creator Pro" };

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
        searchPlaceholder="Search plans and billing…"
      />
      <div className="mx-auto w-full max-w-5xl space-y-7 px-4 py-7 sm:px-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Complete your upgrade to Creator Pro
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Unlock unlimited generations, commercial rights and 4K exports.
          </p>
        </div>

        <UpgradePanel isPro={session.profile.plan === "pro"} status={normalizedStatus} />
      </div>
    </>
  );
}
