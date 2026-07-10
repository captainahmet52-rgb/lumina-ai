"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Lock,
  ShieldCheck,
  Check,
  Loader2,
  CreditCard,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  PRO_FEATURES,
  PRO_PRICE_LABEL,
} from "@/lib/constants";

interface UpgradePanelProps {
  isPro: boolean;
  status?: "success" | "cancelled";
}

export function UpgradePanel({ isPro, status }: UpgradePanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function completePurchase() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", { method: "POST" });
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

  if (isPro) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
            <CheckCircle2 className="size-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold">Creator Pro üyesisin</h2>
            <p className="text-sm text-[var(--muted)]">
              Sınırsız üretim, ticari kullanım hakkı ve 4K indirme senin için
              açık. Lumina AI'ı desteklediğin için teşekkürler.
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard">Stüdyoya Dön</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {status === "success" && (
        <div className="rounded-xl bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-600">
          Ödeme alındı! Planın birkaç saniye içinde Pro'ya geçecek.
        </div>
      )}
      {status === "cancelled" && (
        <div className="rounded-xl bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-600">
          Ödeme iptal edildi — herhangi bir ücret alınmadı.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Payment Method (design — real charge via Stripe Checkout) */}
        <Card>
          <CardContent className="space-y-5 p-6">
            <div className="flex items-center gap-2">
              <CreditCard className="size-5 text-[var(--primary)]" />
              <h2 className="text-base font-semibold">Ödeme Yöntemi</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="cardholder">Kart Üzerindeki İsim</Label>
                <Input id="cardholder" placeholder="Ad Soyad" autoComplete="cc-name" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cardnumber">Kart Numarası</Label>
                <Input
                  id="cardnumber"
                  placeholder="4242 4242 4242 4242"
                  inputMode="numeric"
                  autoComplete="cc-number"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="expiry">Son Kullanma</Label>
                  <Input id="expiry" placeholder="AA / YY" autoComplete="cc-exp" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cvv">CVV</Label>
                  <Input id="cvv" placeholder="123" inputMode="numeric" autoComplete="cc-csc" />
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-xl bg-[var(--bg)] p-3 text-xs text-[var(--muted)]">
              <Lock className="mt-0.5 size-4 shrink-0 text-[var(--primary)]" />
              <span>
                Güvenliğin için kart bilgilerin doğrudan Stripe'ın PCI uyumlu
                ödeme sayfasında işlenir — bizim sunucularımıza hiç uğramaz.
                “Ödemeyi Tamamla”ya bastığında Stripe'a yönlendirilirsin.
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card className="h-fit">
          <CardContent className="space-y-5 p-6">
            <h2 className="text-base font-semibold">Sipariş Özeti</h2>

            <div className="rounded-2xl border border-[var(--primary)]/20 bg-[var(--primary)]/5 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-[var(--text)]">Creator Pro</p>
                  <p className="text-xs text-[var(--muted)]">Aylık faturalandırılır</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-[var(--text)]">
                    {PRO_PRICE_LABEL}
                  </p>
                  <p className="text-xs text-[var(--muted)]">/ ay</p>
                </div>
              </div>
            </div>

            <ul className="space-y-2.5">
              {PRO_FEATURES.map((feature) => (
                <li key={feature} className="flex items-center gap-2.5 text-sm">
                  <span className="flex size-5 items-center justify-center rounded-full bg-emerald-500/12 text-emerald-600">
                    <Check className="size-3" />
                  </span>
                  {feature}
                </li>
              ))}
            </ul>

            <Separator />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-[var(--muted)]">
                <span>Ara Toplam</span>
                <span>{PRO_PRICE_LABEL}</span>
              </div>
              <div className="flex justify-between text-[var(--muted)]">
                <span>Vergi (%0)</span>
                <span>$0.00</span>
              </div>
              <div className="flex justify-between pt-1 text-base font-bold text-[var(--text)]">
                <span>Toplam</span>
                <span>{PRO_PRICE_LABEL}</span>
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button
              size="lg"
              className="w-full"
              onClick={completePurchase}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Yönlendiriliyor…
                </>
              ) : (
                "Ödemeyi Tamamla"
              )}
            </Button>

            <Button asChild variant="ghost" size="sm" className="w-full">
              <Link href="/dashboard">Planlara Dön</Link>
            </Button>

            <div className="flex items-center justify-center gap-4 pt-1 text-[11px] text-[var(--muted)]">
              <span className="flex items-center gap-1">
                <ShieldCheck className="size-3.5" /> PCI Uyumlu
              </span>
              <span className="flex items-center gap-1">
                <Lock className="size-3.5" /> 256-bit SSL
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
