"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, Sparkles, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NAV_ITEMS } from "@/components/app/nav-items";
import { signOut } from "@/app/auth/actions";
import type { Profile } from "@/lib/types";

interface SidebarProps {
  profile: Pick<
    Profile,
    "full_name" | "email" | "avatar_url" | "plan" | "credits"
  >;
}

export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isPro = profile.plan === "pro";

  const content = (
    <>
      <div className="px-5 pt-6">
        <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
          <Logo />
        </Link>
      </div>

      <nav className="mt-8 flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                  : "text-[var(--muted)] hover:bg-[var(--bg)] hover:text-[var(--text)]",
              )}
            >
              <Icon className="size-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-4 px-3 pb-5">
        <Button asChild size="lg" className="w-full">
          <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
            <Sparkles className="size-4" />
            Yeni Video Oluştur
          </Link>
        </Button>

        <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-3">
          <Avatar src={profile.avatar_url} name={profile.full_name} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[var(--text)]">
              {profile.full_name || "Kullanıcı"}
            </p>
            <div className="flex items-center gap-1.5">
              <Badge variant={isPro ? "default" : "muted"} className="px-2 py-0.5">
                {isPro ? "Pro" : "Ücretsiz"}
              </Badge>
              {!isPro && (
                <span className="text-[11px] text-[var(--muted)]">
                  {profile.credits} kredi
                </span>
              )}
            </div>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              title="Çıkış yap"
              className="rounded-lg p-2 text-[var(--muted)] transition-colors hover:bg-white hover:text-red-500"
            >
              <LogOut className="size-4" />
            </button>
          </form>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--card)] px-4 py-3 md:hidden">
        <Logo />
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-2 text-[var(--text)] hover:bg-[var(--bg)]"
          aria-label="Menüyü aç"
        >
          <Menu className="size-5" />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-[280px] flex-col bg-[var(--card)] shadow-card-lg">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-4 top-5 rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--bg)]"
              aria-label="Menüyü kapat"
            >
              <X className="size-5" />
            </button>
            {content}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-[264px] shrink-0 flex-col border-r border-[var(--border)] bg-[var(--card)] md:flex">
        {content}
      </aside>
    </>
  );
}
