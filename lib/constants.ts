/** Shared, UI + server constants (spec §3, §6, §12). */

export const APP_NAME = "Lumina AI";
export const APP_TAGLINE = "Creator Studio";

/** Free plan trial credits (spec §12). */
export const FREE_PLAN_CREDITS = 3;

/** Creator Pro price shown on the payment screen (spec §3.4 / §9). */
export const PRO_PRICE_USD = 29;
export const PRO_PRICE_LABEL = "$29.00";

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
  { value: "cinematic_studio", label: "Cinematic Studio" },
  { value: "product_hero", label: "Product Hero" },
  { value: "lifestyle", label: "Lifestyle" },
  { value: "minimal_clean", label: "Minimal Clean" },
  { value: "neon_futuristic", label: "Neon Futuristic" },
];

export type GenerationStatus = "pending" | "processing" | "completed" | "failed";

/** Accepted upload types for the product image (spec §3.2). */
export const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB

export const PRO_FEATURES = [
  "Unlimited AI Generations",
  "Commercial Usage Rights",
  "4K High-Res Exports",
];

export const STORAGE_BUCKET_PRODUCTS = "products";
export const STORAGE_BUCKET_OUTPUTS = "outputs";
