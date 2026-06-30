import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkles, Images } from "lucide-react";
import { getSessionProfile } from "@/lib/data/profile";
import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/app/topbar";
import { Button } from "@/components/ui/button";
import { ContentCard } from "@/components/content/content-card";
import type { Generation } from "@/lib/types";

export const metadata: Metadata = { title: "My Content" };

export default async function MyContentPage() {
  const session = await getSessionProfile();
  if (!session) redirect("/login");

  const supabase = await createClient();
  const { data } = await supabase
    .from("generations")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  const generations = (data ?? []) as Generation[];

  return (
    <>
      <Topbar profile={session.profile} searchPlaceholder="Search your content…" />
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-7 sm:px-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Content</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {generations.length} generation
              {generations.length === 1 ? "" : "s"} in your library.
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard">
              <Sparkles className="size-4" /> Create New
            </Link>
          </Button>
        </div>

        {generations.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-14 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)]">
              <Images className="size-7" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">No content yet</h2>
              <p className="text-sm text-[var(--muted)]">
                Generate your first AI asset to see it here.
              </p>
            </div>
            <Button asChild>
              <Link href="/dashboard">
                <Sparkles className="size-4" /> Create New Content
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {generations.map((g) => (
              <ContentCard key={g.id} generation={g} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
