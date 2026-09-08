// API: credit balance and spend.
//
// Spending goes through the spend_credit() function so the check and the
// decrement happen in one statement — two tabs can't both spend the last credit.
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Reason = "meditation_created";

const REASONS: Reason[] = ["meditation_created"];

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("credits_remaining, credits_used")
    .eq("id", user.id)
    .maybeSingle();

  return NextResponse.json({
    credits_remaining: profile?.credits_remaining ?? 0,
    credits_used: profile?.credits_used ?? 0,
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { reason } = (await request.json()) as { reason?: Reason };

  if (!reason || !REASONS.includes(reason)) {
    return NextResponse.json({ error: "A valid reason is required" }, { status: 400 });
  }

  const { data: remaining, error } = await supabase.rpc("spend_credit", { p_reason: reason });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (remaining === null) {
    return NextResponse.json(
      { error: "You've used all your free credits. More coming soon." },
      { status: 402 }
    );
  }

  return NextResponse.json({ success: true, credits_remaining: remaining });
}
