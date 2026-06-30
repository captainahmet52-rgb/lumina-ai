import type {
  AspectRatio,
  GenerationStatus,
  StylePreset,
} from "@/lib/constants";

/**
 * NOTE: These DB-row models are declared as `type` aliases (not `interface`)
 * on purpose. Supabase's generics constrain Row/Insert/Update to
 * `Record<string, unknown>`, and TypeScript only gives an implicit index
 * signature to closed `type` aliases — `interface`s can be augmented, so they
 * fail the constraint and queries collapse to `never`.
 */

/** Mirror of the Supabase `profiles` table (spec §5). */
export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  plan: "free" | "pro";
  credits: number;
  subscription_status: string;
  stripe_customer_id: string | null;
  created_at: string;
};

export type GenerationMetadata = {
  model?: string;
  creativity?: number;
  seed?: number;
  [key: string]: unknown;
};

/** Mirror of the Supabase `generations` table (spec §5). */
export type Generation = {
  id: string;
  user_id: string;
  product_image_url: string;
  prompt: string;
  style_preset: StylePreset | string;
  aspect_ratio: AspectRatio | string;
  status: GenerationStatus;
  video_url: string | null;
  image_urls: string[] | null;
  metadata: GenerationMetadata | null;
  error: string | null;
  created_at: string;
  completed_at: string | null;
};

/**
 * Minimal typed Supabase schema for the client/server helpers.
 * Shaped to satisfy `@supabase/supabase-js`'s `GenericSchema` constraint
 * (Views/Functions/Enums/CompositeTypes + per-table Relationships) so query
 * results infer correctly instead of collapsing to `never`.
 */
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string };
        Update: Partial<Profile>;
        Relationships: [];
      };
      generations: {
        // user_id/product_image_url/prompt are required; the rest have DB
        // defaults or are nullable, so they're optional on insert.
        Row: Generation;
        Insert: {
          id?: string;
          user_id: string;
          product_image_url: string;
          prompt: string;
          style_preset?: StylePreset | string;
          aspect_ratio?: AspectRatio | string;
          status?: GenerationStatus;
          video_url?: string | null;
          image_urls?: string[] | null;
          metadata?: GenerationMetadata | null;
          error?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: Partial<Generation>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
