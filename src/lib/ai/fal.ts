// IDSHIFT — fal.ai model integration
//
// Every generative call (text, image, video, speech) goes through fal.ai so
// there is one key, one billing surface, and one place to swap a model.
//
// Two transports:
//   fal.run    — synchronous, for fast models (text, single image)
//   queue.fal.run — submit + poll, for anything that can outlive a request
//
// Without FAL_KEY the module runs in mock mode: calls resolve to deterministic
// placeholders so the feed, the survey and the dashboard all work end to end in
// local dev. Mock results are flagged so nothing is presented as real media.

const FAL_SYNC_URL = "https://fal.run";
const FAL_QUEUE_URL = "https://queue.fal.run";

/** Pinned model ids. Swapping a model is a one-line change here. */
export const FAL_MODELS = {
  /** Text: affirmations, carousel copy, meditation scripts. */
  text: "fal-ai/any-llm",
  /** Image without a reference photo. */
  image: "fal-ai/flux/dev",
  /** Image that preserves the user's likeness from a reference photo. */
  imageWithLikeness: "fal-ai/flux-pulid",
  /** Short clip from a still — used for the feed's 15-60s pieces. */
  video: "fal-ai/kling-video/v2/master/image-to-video",
  /** Meditation narration. */
  speech: "fal-ai/minimax/speech-02-hd",
} as const;

/** LLM served through fal's any-llm router. */
export const FAL_TEXT_MODEL = "google/gemini-flash-1.5";

export function isFalConfigured(): boolean {
  return Boolean(process.env.FAL_KEY);
}

export class FalError extends Error {
  constructor(
    message: string,
    readonly status?: number
  ) {
    super(message);
    this.name = "FalError";
  }
}

function headers(): HeadersInit {
  return {
    Authorization: `Key ${process.env.FAL_KEY}`,
    "Content-Type": "application/json",
  };
}

/** Synchronous call. Use for models that answer in a few seconds. */
export async function falRun<T>(model: string, input: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${FAL_SYNC_URL}/${model}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new FalError(`fal.run ${model} failed: ${await response.text()}`, response.status);
  }

  return (await response.json()) as T;
}

export interface QueueOptions {
  /** How long to keep polling before giving up. */
  timeoutMs?: number;
  pollIntervalMs?: number;
  /** fal calls this URL when the job finishes, instead of us polling. */
  webhookUrl?: string;
}

export interface QueueSubmission {
  request_id: string;
  status_url: string;
  response_url: string;
}

/** Submits a job and returns immediately — poll or take the webhook. */
export async function falSubmit(
  model: string,
  input: Record<string, unknown>,
  options: QueueOptions = {}
): Promise<QueueSubmission> {
  const url = new URL(`${FAL_QUEUE_URL}/${model}`);
  if (options.webhookUrl) url.searchParams.set("fal_webhook", options.webhookUrl);

  const response = await fetch(url, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new FalError(`fal queue submit ${model} failed: ${await response.text()}`, response.status);
  }

  return (await response.json()) as QueueSubmission;
}

export async function falResult<T>(submission: QueueSubmission, options: QueueOptions = {}): Promise<T> {
  const timeoutMs = options.timeoutMs ?? 180_000;
  const pollIntervalMs = options.pollIntervalMs ?? 2_000;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const status = await fetch(submission.status_url, { headers: headers() });
    if (!status.ok) {
      throw new FalError(`fal status check failed: ${await status.text()}`, status.status);
    }

    const { status: state } = (await status.json()) as { status: string };

    if (state === "COMPLETED") {
      const result = await fetch(submission.response_url, { headers: headers() });
      if (!result.ok) {
        throw new FalError(`fal result fetch failed: ${await result.text()}`, result.status);
      }
      return (await result.json()) as T;
    }

    if (state === "FAILED" || state === "CANCELLED") {
      throw new FalError(`fal job ${state.toLowerCase()}`);
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new FalError(`fal job timed out after ${timeoutMs}ms`);
}

/** Submit and wait. For video and speech, which take tens of seconds. */
export async function falRunQueued<T>(
  model: string,
  input: Record<string, unknown>,
  options: QueueOptions = {}
): Promise<T> {
  return falResult<T>(await falSubmit(model, input, options), options);
}

// ---------------------------------------------------------------------------
// Typed helpers, one per modality
// ---------------------------------------------------------------------------

export interface TextRequest {
  prompt: string;
  systemPrompt?: string;
  model?: string;
}

export async function generateText(request: TextRequest): Promise<string> {
  const result = await falRun<{ output?: string; text?: string }>(FAL_MODELS.text, {
    model: request.model ?? FAL_TEXT_MODEL,
    prompt: request.prompt,
    ...(request.systemPrompt ? { system_prompt: request.systemPrompt } : {}),
  });

  const output = result.output ?? result.text;
  if (!output) throw new FalError("fal text model returned no output");
  return output.trim();
}

export interface ImageRequest {
  prompt: string;
  /** A user photo, when the image should look like them. */
  referenceImageUrl?: string;
  aspectRatio?: "1:1" | "4:5" | "9:16" | "16:9";
}

const IMAGE_SIZES: Record<NonNullable<ImageRequest["aspectRatio"]>, string> = {
  "1:1": "square_hd",
  "4:5": "portrait_4_3",
  "9:16": "portrait_16_9",
  "16:9": "landscape_16_9",
};

export interface ImageResult {
  url: string;
  mock: boolean;
}

export async function generateImage(request: ImageRequest): Promise<ImageResult> {
  const image_size = IMAGE_SIZES[request.aspectRatio ?? "4:5"];

  const result = request.referenceImageUrl
    ? await falRunQueued<{ images: { url: string }[] }>(FAL_MODELS.imageWithLikeness, {
        prompt: request.prompt,
        reference_image_url: request.referenceImageUrl,
        image_size,
      })
    : await falRun<{ images: { url: string }[] }>(FAL_MODELS.image, {
        prompt: request.prompt,
        image_size,
        num_images: 1,
      });

  const url = result.images?.[0]?.url;
  if (!url) throw new FalError("fal image model returned no image");
  return { url, mock: false };
}

export interface VideoRequest {
  prompt: string;
  /** First frame — usually an image we just generated. */
  imageUrl: string;
  durationSeconds?: number;
}

export async function generateVideo(request: VideoRequest): Promise<{ url: string }> {
  const result = await falRunQueued<{ video: { url: string } }>(FAL_MODELS.video, {
    prompt: request.prompt,
    image_url: request.imageUrl,
    duration: String(request.durationSeconds ?? 5),
  });

  if (!result.video?.url) throw new FalError("fal video model returned no video");
  return { url: result.video.url };
}

export interface SpeechRequest {
  text: string;
  voice?: string;
  /** 0.5 slow (induction) to 1.0 normal. */
  speed?: number;
}

export async function generateSpeech(request: SpeechRequest): Promise<{ url: string }> {
  const result = await falRunQueued<{ audio: { url: string } }>(FAL_MODELS.speech, {
    text: request.text,
    voice_setting: {
      voice_id: request.voice ?? "Wise_Woman",
      speed: request.speed ?? 0.85,
    },
  });

  if (!result.audio?.url) throw new FalError("fal speech model returned no audio");
  return { url: result.audio.url };
}
