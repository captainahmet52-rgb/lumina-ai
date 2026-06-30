"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { UploadCloud, Loader2, X, ImageIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  STORAGE_BUCKET_PRODUCTS,
} from "@/lib/constants";

interface UploadProductProps {
  userId: string;
  value: string | null;
  onChange: (publicUrl: string | null) => void;
  bucket?: string;
}

export function UploadProduct({ userId, value, onChange, bucket = "products" }: UploadProductProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);

      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        setError("Please upload a PNG, JPG or WEBP file.");
        return;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        setError("File is too large (max 10MB).");
        return;
      }

      setUploading(true);
      try {
        const supabase = createClient();
        const ext = file.name.split(".").pop() || "png";
        const path = `${userId}/${crypto.randomUUID()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(path, file, { cacheControl: "3600", upsert: false });

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from(bucket).getPublicUrl(path);

        onChange(publicUrl);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Upload failed. Try again.",
        );
      } finally {
        setUploading(false);
      }
    },
    [userId, onChange],
  );

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  if (value) {
    return (
      <div className="group relative aspect-square w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg)]">
        <Image
          src={value}
          alt="Uploaded product"
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-contain"
        />
        <button
          type="button"
          onClick={() => onChange(null)}
          className="absolute right-3 top-3 rounded-lg bg-white/90 p-1.5 text-[var(--text)] shadow-card transition-colors hover:bg-white hover:text-red-500"
          aria-label="Remove image"
        >
          <X className="size-4" />
        </button>
        <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-lg bg-white/90 px-2.5 py-1 text-xs font-medium text-[var(--text)] shadow-card">
          <ImageIcon className="size-3.5 text-[var(--primary)]" /> Product ready
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={onDrop}
        className={cn(
          "flex aspect-square w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-6 text-center transition-colors",
          dragActive
            ? "border-[var(--primary)] bg-[var(--primary)]/5"
            : "border-[var(--border)] bg-[var(--bg)] hover:border-[var(--primary)]/50",
        )}
      >
        <div className="flex size-14 items-center justify-center rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)]">
          {uploading ? (
            <Loader2 className="size-6 animate-spin" />
          ) : (
            <UploadCloud className="size-6" />
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--text)]">
            {uploading ? "Uploading…" : "Drag & drop your product"}
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            or click to browse · PNG / JPG / WEBP
          </p>
          <p className="mt-2 text-xs text-[var(--muted)]">
            Best results with transparent PNGs
          </p>
        </div>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
