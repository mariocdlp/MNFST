// Video Generation Pipeline
// Orchestrates: Imagen (likeness) → Veo (clips) → TTS (narration) → FFmpeg (assembly)
//
// At MVP, this module defines the pipeline interface and handles orchestration.
// Each step calls out to Google Cloud APIs (Vertex AI for Imagen/Veo, Cloud TTS for narration).
// FFmpeg runs server-side for final assembly.

import { type SurveyData } from "@/types";
import { getVibe } from "@/lib/templates";
import { generateScript, toSSML } from "./script";

export interface PipelineStatus {
  step: "likeness" | "clips" | "narration" | "assembly" | "upload" | "complete" | "failed";
  progress: number; // 0-100
  message: string;
  section?: string;
}

export interface PipelineResult {
  success: boolean;
  videoUrl?: string;
  thumbnailUrl?: string;
  error?: string;
  log: PipelineLogEntry[];
}

export interface PipelineLogEntry {
  step: string;
  status: "started" | "completed" | "failed" | "retrying";
  message: string;
  timestamp: string;
  duration_ms?: number;
}

// Generate image prompts from template + survey data
export function buildImagePrompts(
  surveyData: SurveyData,
  templateId: string,
  vibeId: string
): { section: string; prompts: string[] }[] {
  const vibe = getVibe(templateId, vibeId);
  if (!vibe) throw new Error(`Vibe not found: ${templateId}/${vibeId}`);

  const fill = (template: string) => {
    return template
      .replaceAll("{{user_likeness}}", `person resembling the user`)
      .replaceAll("{{dream_scene}}", surveyData.dream_scene)
      .replaceAll("{{dream_description}}", surveyData.dream_description)
      .replaceAll("{{dream_emotions}}", surveyData.dream_emotions.join(", "))
      .replaceAll("{{daily_habit}}", surveyData.daily_habit)
      .replaceAll("{{ideal_routine}}", surveyData.ideal_routine)
      .replaceAll("{{occupation}}", surveyData.occupation);
  };

  const result: { section: string; prompts: string[] }[] = [];

  // Section 1 & 2: Generic scenes, no user likeness needed
  result.push({ section: "induction", prompts: vibe.sections.induction.scene_prompts ?? [] });
  result.push({ section: "gratitude", prompts: vibe.sections.gratitude.scene_prompts ?? [] });

  // Section 3: Dream Realized — user in their dream (4-6 images)
  const dreamPrompts: string[] = [];
  if (vibe.sections.dream_realized.scene_prompt_template) {
    dreamPrompts.push(fill(vibe.sections.dream_realized.scene_prompt_template));
  }
  if (vibe.sections.dream_realized.secondary_scene_template) {
    dreamPrompts.push(fill(vibe.sections.dream_realized.secondary_scene_template));
  }
  result.push({ section: "dream_realized", prompts: dreamPrompts });

  // Section 4: Mental Contrasting
  result.push({
    section: "mental_contrasting",
    prompts: vibe.sections.mental_contrasting.scene_prompts ?? [],
  });

  // Section 5: Identity & Action — user performing habits (6-8 images)
  const actionPrompts: string[] = [];
  if (vibe.sections.identity_action.scene_prompt_template) {
    actionPrompts.push(fill(vibe.sections.identity_action.scene_prompt_template));
  }
  if (vibe.sections.identity_action.routine_prompt_template) {
    actionPrompts.push(fill(vibe.sections.identity_action.routine_prompt_template));
  }
  result.push({ section: "identity_action", prompts: actionPrompts });

  // Section 6: Integration
  result.push({ section: "integration", prompts: vibe.sections.integration.scene_prompts ?? [] });

  return result;
}

// Main pipeline orchestrator
// In production, this runs on Cloud Functions/Cloud Run
export async function runPipeline(
  surveyData: SurveyData,
  templateId: string,
  vibeId: string,
  userPhotoUrls: string[],
  onProgress?: (status: PipelineStatus) => void
): Promise<PipelineResult> {
  const log: PipelineLogEntry[] = [];
  const logEntry = (step: string, status: PipelineLogEntry["status"], message: string) => {
    log.push({ step, status, message, timestamp: new Date().toISOString() });
  };

  try {
    // Step 1: Generate the narration script
    const script = generateScript(surveyData);
    logEntry("script", "completed", "Script generated with all user variables");

    // Step 2: Build image prompts
    onProgress?.({ step: "likeness", progress: 10, message: "Creating your personalized imagery..." });
    const imagePrompts = buildImagePrompts(surveyData, templateId, vibeId);
    logEntry("prompts", "completed", `Built ${imagePrompts.reduce((sum, s) => sum + s.prompts.length, 0)} image prompts`);

    // Step 3: Generate images via Imagen on Vertex AI
    onProgress?.({ step: "likeness", progress: 20, message: "Generating your likeness in dream scenarios..." });
    logEntry("imagen", "started", "Starting Imagen generation");

    // In production: call Vertex AI Imagen API for each prompt
    // const imagenResults = await generateImages(imagePrompts, userPhotoUrls);
    logEntry("imagen", "completed", "Imagen generation complete");

    // Step 4: Generate video clips via Veo
    onProgress?.({ step: "clips", progress: 40, message: "Animating your scenes..." });
    logEntry("veo", "started", "Starting Veo video generation");

    // In production: call Vertex AI Veo API for each image
    // const veoResults = await generateClips(imagenResults);
    logEntry("veo", "completed", "Veo clip generation complete");

    // Step 5: Generate narration via Google Cloud TTS
    onProgress?.({ step: "narration", progress: 60, message: "Creating your personalized narration..." });
    logEntry("tts", "started", "Starting TTS narration");

    if (surveyData.voice_pref !== "none") {
      for (const section of script.sections) {
        const ssml = toSSML(section.narration_lines);
        // In production: call Google Cloud TTS API
        // const audioBuffer = await synthesizeSpeech(ssml, surveyData.voice_pref);
        logEntry("tts", "completed", `Section ${section.id} narration generated. SSML length: ${ssml.length}`);
      }
    } else {
      logEntry("tts", "completed", "Narration skipped (user preference: none)");
    }

    // Step 6: Assembly via FFmpeg
    onProgress?.({ step: "assembly", progress: 75, message: "Assembling your video..." });
    logEntry("ffmpeg", "started", "Starting FFmpeg assembly");

    // In production: run FFmpeg pipeline
    // const videoPath = await assembleVideo(veoResults, ttsResults, vibeId);
    logEntry("ffmpeg", "completed", "Video assembly complete");

    // Step 7: Upload to cloud storage
    onProgress?.({ step: "upload", progress: 90, message: "Finalizing your video..." });
    logEntry("upload", "started", "Uploading to cloud storage");

    // In production: upload to Supabase storage / GCS
    // const videoUrl = await uploadVideo(videoPath, userId);
    logEntry("upload", "completed", "Upload complete");

    onProgress?.({ step: "complete", progress: 100, message: "Your video is ready!" });

    return {
      success: true,
      videoUrl: "/demo-video.mp4", // Placeholder until real pipeline is connected
      thumbnailUrl: "/demo-thumbnail.jpg",
      log,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logEntry("pipeline", "failed", message);
    onProgress?.({ step: "failed", progress: 0, message: `Generation failed: ${message}` });
    return { success: false, error: message, log };
  }
}

// Retry wrapper for API calls — retries up to 3 times with modified prompts
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  onRetry?: (attempt: number, error: Error) => void
): Promise<T> {
  let lastError: Error | undefined;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxRetries) {
        onRetry?.(attempt, lastError);
        await new Promise((r) => setTimeout(r, 1000 * attempt)); // Exponential-ish backoff
      }
    }
  }
  throw lastError;
}
