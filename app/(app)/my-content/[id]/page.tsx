import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/data/profile";
import { Topbar } from "@/components/app/topbar";
import { GenerationView } from "@/components/generation/generation-view";
import type { Generation } from "@/lib/types";

export const metadata: Metadata = { title: "Generation" };

export default async function GenerationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await getSessionProfile();
  if (!session) redirect("/login");

  const supabase = await createClient();
  const { data } = await supabase
    .from("generations")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  // RLS guarantees the row belongs to the user; missing → 404.
  if (!data) notFound();

  return (
    <>
      <Topbar profile={session.profile} />
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-7 sm:px-8">
        <Link
          href="/my-content"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--text)]"
        >
          <ArrowLeft className="size-4" /> Back to My Content
        </Link>

        <GenerationView initial={data as Generation} />
      </div>
    </>
  );
}
