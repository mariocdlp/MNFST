// API: record what the user did with a card — seen it, saved it, finished it.
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Action = "viewed" | "saved" | "unsaved" | "completed";

const ACTIONS: Action[] = ["viewed", "saved", "unsaved", "completed"];

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { feedId, action } = (await request.json()) as { feedId?: string; action?: Action };

  if (!feedId || !action || !ACTIONS.includes(action)) {
    return NextResponse.json({ error: "feedId and a valid action are required" }, { status: 400 });
  }

  const patch =
    action === "viewed"
      ? { viewed: true, viewed_at: new Date().toISOString() }
      : action === "saved"
        ? { saved: true }
        : action === "unsaved"
          ? { saved: false }
          : { completed: true, viewed: true };

  const { error } = await supabase
    .from("user_feed")
    .update(patch)
    .eq("id", feedId)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
