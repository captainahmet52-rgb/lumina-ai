"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Lock,
  ShieldCheck,
  Check,
  Loader2,
  Sparkles,
  Video,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CREDIT_PACKAGES, type CreditPackage } from "@/lib/constants";

interface UpgradePanelProps {
  credits: number;
  status?: "success" | "cancelled";
}

function formatTry(value: number) {
  return `${value.toLocaleString("tr-TR")} TL`;
}

export function UpgradePanel({ credits, status }: UpgradePanelProps) {
  const [selected, setSelected] = useState<CreditPackage>(
    CREDIT_PACKAGES.find((p) => p.popular) ?? CREDIT_PACKAGES[0],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function buy() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ package_id: selected.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Ödeme başlatılamadı.");
        setLoading(false);
        return;
      }
      // Stripe'ın barındırdığı, PCI uyumlu ödeme sayfasına yönlendir.
      window.location.href = data.url;
    } catch {
      setError("Bağlantı hatası. Lütfen tekrar dene.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {status === "success" && (
        <div className="rounded-xl bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-600">
          Ödeme alındı! Kredilerin birkaç saniye içinde hesabına eklenecek.
        </div>
      )}
      {status === "cancelled" && (
        <div className="rounded-xl bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-600">
          Ödeme iptal edildi — herhangi bir ücret alınmadı.
        </div>
      )}

      {/* Mevcut kredi durumu */}
      <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-5 py-4">
        <div className="flex size-11 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
          <Video className="size-5" />
        </div>
        <div>
          <p className="text-sm text-[var(--muted)]">Mevcut kredin</p>
          <p className="text-lg font-bold text-[var(--text)]">
            {credits} video kredisi
          </p>
        </div>
      </div>

      {/* Paketler */}
      <div className="grid gap-4 sm:grid-cols-3">
        {CREDIT_PACKAGES.map((pkg) => {
          const active = selected.id === pkg.id;
          return (
            <button
              key={pkg.id}
              type="button"
              onClick={() => setSelected(pkg)}
              className={
                active
                  ? "relative flex flex-col rounded-2xl border-2 border-[var(--primary)] bg-[var(--primary)]/5 p-5 text-left transition-colors"
                  : "relative flex flex-col rounded-2xl border-2 border-[var(--border)] bg-[var(--card)] p-5 text-left transition-colors hover:border-[var(--primary)]/40"
              }
            >
              {pkg.popular && (
                <Badge
                  variant="default"
                  className="absolute -top-2.5 left-1/2 -translate-x-1/2"
                >
                  En Popüler
                </Badge>
              )}
              <div className="flex items-center justify-between">
                <p className="font-semibold text-[var(--text)]">{pkg.name}</p>
                <span
                  className={
                    active
                      ? "flex size-5 items-center justify-center rounded-full bg-[var(--primary)] text-white"
                      : "size-5 rounded-full border border-[var(--border)]"
                  }
                >
                  {active && <Check className="size-3" />}
                </span>
              </div>

              <p className="mt-3 text-2xl font-bold text-[var(--text)]">
                {formatTry(pkg.priceTry)}
              </p>
              <p className="text-xs text-[var(--muted)]">
                {pkg.credits} video · video başı {formatTry(pkg.perVideo)}
              </p>

              {pkg.badge && (
                <span className="mt-3 inline-flex w-fit items-center gap-1 rounded-full bg-emerald-500/12 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
                  <Sparkles className="size-3" /> {pkg.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Özet + satın al */}
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-[var(--text)]">
                {selected.name} paketi
              </p>
              <p className="text-sm text-[var(--muted)]">
                {selected.credits} video kredisi hesabına eklenir
              </p>
            </div>
            <p className="text-2xl font-bold text-[var(--text)]">
              {formatTry(selected.priceTry)}
            </p>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button
            size="xl"
            className="w-full"
            onClick={buy}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="size-5 animate-spin" /> Yönlendiriliyor…
              </>
            ) : (
              <>
                <Lock className="size-4" /> Güvenli Ödeme ile Satın Al
              </>
            )}
          </Button>

          <Button asChild variant="ghost" size="sm" className="w-full">
            <Link href="/dashboard">Panele Dön</Link>
          </Button>

          <div className="flex items-center justify-center gap-4 pt-1 text-[11px] text-[var(--muted)]">
            <span className="flex items-center gap-1">
              <ShieldCheck className="size-3.5" /> Güvenli Ödeme
            </span>
            <span className="flex items-center gap-1">
              <Lock className="size-3.5" /> 256-bit SSL
            </span>
          </div>

          <p className="text-center text-[11px] text-[var(--muted)]">
            Ödeme, Stripe&apos;ın PCI uyumlu güvenli sayfasında alınır. Kart
            bilgilerin bizim sunucularımıza hiç uğramaz.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
