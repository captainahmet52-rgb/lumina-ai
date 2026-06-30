import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/data/profile";
import { Sidebar } from "@/components/app/sidebar";

/**
 * Authenticated app shell (spec §3 — sidebar + content area).
 * Middleware already gates these routes; this guard is belt-and-suspenders.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await getSessionProfile();
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <Sidebar profile={session.profile} />
      <main className="flex min-w-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
