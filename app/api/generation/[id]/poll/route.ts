import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { finalizeGeneration } from "@/lib/pipeline";
import type { Generation } from "@/lib/types";

export const runtime = "nodejs";

/**
 * GET /api/generation/[id]/poll — sonuç ekranı bunu periyodik çağırır.
 * fal kuyruğunu kontrol eder, video bittiyse kaydı `completed` yapar,
 * güncel generation satırını döner. RLS sahibi doğrular.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data } = await supabase
    .from("generations")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await finalizeGeneration(data as Generation);
  return NextResponse.json({ generation: updated });
}
