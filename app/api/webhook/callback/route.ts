import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidCallbackSecret } from "@/lib/webhook";
import type { GenerationStatus } from "@/lib/constants";
import type { Generation, GenerationMetadata } from "@/lib/types";

interface CallbackBody {
  generation_id?: string;
  status?: string;
  video_url?: string;
  image_urls?: string[];
  metadata?: GenerationMetadata;
  error?: string;
  callback_secret?: string;
}

const ALLOWED_STATUSES: GenerationStatus[] = [
  "pending",
  "processing",
  "completed",
  "failed",
];

/**
 * POST /api/webhook/callback — n8n reports the finished job (spec §7.2).
 * Verifies the shared secret (header or body), then updates the row with the
 * service role key so Realtime pushes the result to the frontend.
 */
export async function POST(request: NextRequest) {
  let body: CallbackBody;
  try {
    body = (await request.json()) as CallbackBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Secret can arrive in the header or the body.
  const headerSecret =
    request.headers.get("x-callback-secret") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const provided = headerSecret || body.callback_secret;

  if (!isValidCallbackSecret(provided)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!body.generation_id) {
    return NextResponse.json(
      { error: "generation_id is required" },
      { status: 400 },
    );
  }

  const status: GenerationStatus = ALLOWED_STATUSES.includes(
    body.status as GenerationStatus,
  )
    ? (body.status as GenerationStatus)
    : "completed";

  const admin = createAdminClient();

  const update: Partial<Generation> = { status };
  if (body.video_url !== undefined) update.video_url = body.video_url;
  if (body.image_urls !== undefined) update.image_urls = body.image_urls;
  if (body.metadata !== undefined) update.metadata = body.metadata;
  if (body.error !== undefined) update.error = body.error;
  if (status === "completed" || status === "failed") {
    update.completed_at = new Date().toISOString();
  }

  const { error } = await admin
    .from("generations")
    .update(update)
    .eq("id", body.generation_id);

  if (error) {
    return NextResponse.json(
      { error: "Failed to update generation" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
