"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProfileFormProps {
  userId: string;
  initialName: string;
  email: string;
}

export function ProfileForm({ userId, initialName, email }: ProfileFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);

    const supabase = createClient();
    // RLS "own profile" policy permits this update.
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim() })
      .eq("id", userId);

    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }

    // Keep auth metadata in sync (used by OAuth display name).
    await supabase.auth.updateUser({ data: { full_name: fullName.trim() } });

    setSaving(false);
    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="settings-name">Ad Soyad</Label>
        <Input
          id="settings-name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Adın"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="settings-email">E-posta Adresi</Label>
        <Input id="settings-email" value={email} disabled />
        <p className="text-xs text-[var(--muted)]">
          E-posta, giriş yöntemin üzerinden yönetilir.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" disabled={saving}>
        {saving && <Loader2 className="size-4 animate-spin" />}
        {saved && <Check className="size-4" />}
        {saved ? "Kaydedildi" : "Değişiklikleri Kaydet"}
      </Button>
    </form>
  );
}
