// Visual grading and audio beds per the user's preferences. These strings go
// into fal image/video prompts, so they are written as prompt fragments.

import type { MusicEnergy, VisualMood, VoicePreference } from "@/types";

export const VISUAL_GRADING: Record<VisualMood, string> = {
  warm_cinematic:
    "warm golden grade, soft amber highlights, gentle film grain, shallow depth of field, late-afternoon light",
  clean_modern:
    "clean neutral grade, bright diffused light, minimal composition, crisp detail, generous negative space",
  dark_dramatic:
    "low-key grade, deep shadows, single hard key light, high contrast, cinematic anamorphic feel",
};

export const MUSIC_BEDS: Record<MusicEnergy, string> = {
  calm_ambient: "ambient_calm",
  uplifting_emotional: "ambient_uplifting",
  powerful_driving: "ambient_driving",
};

/** fal speech voice ids, chosen for warmth rather than polish. */
export const NARRATION_VOICES: Record<Exclude<VoicePreference, "none">, string> = {
  female: "Wise_Woman",
  male: "Calm_Man",
};

export function buildImagePrompt(scene: string, mood: VisualMood): string {
  return `${scene}. ${VISUAL_GRADING[mood]}. Photographic, no text, no watermark.`;
}
