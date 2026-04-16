// API: Trigger video generation pipeline for a queued video
// In production, this enqueues a job on Cloud Run/Cloud Functions
// At MVP, runs the pipeline inline (use a queue in production for long-running jobs)
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runPipeline } from "@/lib/pipeline/generate";
import type { SurveyData } from "@/types";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { videoId } = await request.json();
  if (!videoId) return NextResponse.json({ error: "videoId required" }, { status: 400 });

  // Fetch video + survey data
  const { data: video, error: videoError } = await supabase
    .from("videos")
    .select("*, survey_responses(response_data)")
    .eq("id", videoId)
    .eq("user_id", user.id)
    .single();

  if (videoError || !video) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  if (video.status !== "queued") {
    return NextResponse.json({ error: "Video already processing or complete" }, { status: 400 });
  }

  // Check user still has credits
  const { data: profile } = await supabase
    .from("profiles")
    .select("credits_remaining")
    .eq("id", user.id)
    .single();

  if ((profile?.credits_remaining ?? 0) < 1) {
    return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
  }

  // Mark as generating
  await supabase.from("videos").update({
    status: "generating",
    generation_started_at: new Date().toISOString(),
  }).eq("id", videoId);

  const surveyData = video.survey_responses?.response_data as SurveyData;

  // Get user photos
  const { data: photos } = await supabase
    .from("user_photos")
    .select("photo_url")
    .eq("user_id", user.id)
    .order("uploaded_at", { ascending: true });

  const photoUrls = photos?.map((p: { photo_url: string }) => p.photo_url) ?? [];

  try {
    const result = await runPipeline(
      surveyData,
      video.template_id,
      video.vibe_id,
      photoUrls
    );

    if (result.success) {
      await supabase.from("videos").update({
        status: "completed",
        video_url: result.videoUrl,
        thumbnail_url: result.thumbnailUrl,
        generation_completed_at: new Date().toISOString(),
        generation_log: result.log,
      }).eq("id", videoId);

      // Create video ready notification
      await supabase.from("notifications").insert({
        user_id: user.id,
        type: "video_ready",
        title: "Your video is ready",
        content: `Your personalized manifestation video has been generated and is ready to watch.`,
      });

      return NextResponse.json({ success: true, videoUrl: result.videoUrl });
    } else {
      await supabase.from("videos").update({
        status: "failed",
        generation_log: result.log,
      }).eq("id", videoId);

      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await supabase.from("videos").update({ status: "failed" }).eq("id", videoId);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Poll video status
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get("videoId");

  const { data: video } = await supabase
    .from("videos")
    .select("id, status, video_url, thumbnail_url, generation_log")
    .eq("id", videoId)
    .eq("user_id", user.id)
    .single();

  if (!video) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(video);
}
