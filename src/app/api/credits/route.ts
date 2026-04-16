// API: Credit management — check balance and deduct
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET: Return current credit balance
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("credits_remaining, credits_used")
    .eq("id", user.id)
    .single();

  return NextResponse.json({
    credits_remaining: profile?.credits_remaining ?? 0,
    credits_used: profile?.credits_used ?? 0,
  });
}

// POST: Deduct one credit (idempotent — pass videoId to prevent double-deduct)
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { videoId } = await request.json();

  const { data: profile } = await supabase
    .from("profiles")
    .select("credits_remaining, credits_used")
    .eq("id", user.id)
    .single();

  if (!profile || profile.credits_remaining < 1) {
    return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      credits_remaining: profile.credits_remaining - 1,
      credits_used: (profile.credits_used ?? 0) + 1,
      last_credit_used_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    success: true,
    credits_remaining: profile.credits_remaining - 1,
    videoId,
  });
}
