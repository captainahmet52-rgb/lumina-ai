/** Shared, UI + server constants (spec §3, §6, §12). */

export const APP_NAME = "Lumina AI";
export const APP_TAGLINE = "Creator Studio";

/** Free plan trial credits (spec §12). */
export const FREE_PLAN_CREDITS = 3;

/** Creator Pro price shown on the payment screen (spec §3.4 / §9). */
export const PRO_PRICE_USD = 29;
export const PRO_PRICE_LABEL = "$29.00";

/** Video başı taban fiyat (TL). */
export const VIDEO_PRICE_TRY = 300;

/** Kredi satın alma paketleri (1 kredi = 1 video). Fiyatlar TL. */
export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  /** Toplam fiyat (TL). */
  priceTry: number;
  /** Video başı fiyat — kartta gösterim için. */
  perVideo: number;
  /** İndirim etiketi (örn: "%17 indirim"). */
  badge?: string;
  /** "En popüler" vurgusu. */
  popular?: boolean;
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: "starter",
    name: "Başlangıç",
    credits: 1,
    priceTry: 300,
    perVideo: 300,
  },
  {
    id: "creator",
    name: "Üretici",
    credits: 5,
    priceTry: 1350,
    perVideo: 270,
    badge: "%10 indirim",
    popular: true,
  },
  {
    id: "pro",
    name: "Profesyonel",
    credits: 10,
    priceTry: 2500,
    perVideo: 250,
    badge: "%17 indirim",
  },
];

export type AspectRatio = "1:1" | "16:9" | "9:16";

export const ASPECT_RATIOS: { value: AspectRatio; label: string; hint: string }[] = [
  { value: "1:1", label: "1:1", hint: "Square" },
  { value: "16:9", label: "16:9", hint: "Landscape" },
  { value: "9:16", label: "9:16", hint: "Vertical" },
];

export type StylePreset =
  | "cinematic_studio"
  | "product_hero"
  | "lifestyle"
  | "minimal_clean"
  | "neon_futuristic";

export const STYLE_PRESETS: { value: StylePreset; label: string }[] = [
  { value: "cinematic_studio", label: "Sinematik Stüdyo" },
  { value: "product_hero", label: "Ürün Vitrini" },
  { value: "lifestyle", label: "Yaşam Tarzı" },
  { value: "minimal_clean", label: "Sade & Temiz" },
  { value: "neon_futuristic", label: "Neon Fütüristik" },
];

export type GenerationStatus = "pending" | "processing" | "completed" | "failed";

/** Accepted upload types for the product image (spec §3.2). */
export const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB

export const PRO_FEATURES = [
  "Sınırsız Video Üretimi",
  "Ticari Kullanım Hakkı",
  "4K Yüksek Çözünürlük İndirme",
];

export const STORAGE_BUCKET_PRODUCTS = "products";
export const STORAGE_BUCKET_OUTPUTS = "outputs";
