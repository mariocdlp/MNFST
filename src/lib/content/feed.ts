// IDSHIFT — the feed algorithm
//
// The feed is not a shuffle. It follows a daily rhythm the research implies:
// gratitude and identity in the morning (prime the reward system, then set the
// self-image), rehearsal and reframing at midday (when the day pushes back),
// reflection and a wind-down at night. Within each slot, pieces are scored on
// goal relevance, method fit, length preference and intensity pacing, and the
// same user gets the same feed all day — but a different one tomorrow.

import type {
  ContentFormat,
  ContentLibraryItem,
  GeneratedContent,
  Intensity,
  MethodTag,
  SurveyData,
  TimeOfDay,
} from "@/types";
import { LENGTH_PREF_SECONDS } from "@/types";
import { contentLibrary } from "./library";
import { personalizationDensity } from "./personalize";

export interface FeedRole {
  /** Why this position exists — surfaced in logs and tests, never to the user. */
  intent: string;
  methods: MethodTag[];
  formats: ContentFormat[];
}

/** The daily rhythm: what each position in a slot is for. */
export const FEED_RHYTHM: Record<TimeOfDay, FeedRole[]> = {
  morning: [
    {
      intent: "gratitude_priming",
      methods: ["gratitude_neuroscience"],
      formats: ["affirmation", "image", "carousel"],
    },
    {
      intent: "identity_affirmation",
      methods: ["self_affirmation", "psycho_cybernetics_self_image", "identity_based_habits"],
      formats: ["affirmation", "image"],
    },
    {
      intent: "implementation_intention",
      methods: ["implementation_intentions", "habit_loop"],
      formats: ["image", "affirmation", "carousel"],
    },
    {
      intent: "morning_rehearsal",
      methods: ["mental_rehearsal", "silva_mirror_of_mind"],
      formats: ["meditation", "video", "carousel"],
    },
  ],
  midday: [
    {
      intent: "mental_rehearsal",
      methods: ["mental_rehearsal", "psycho_cybernetics_theater_of_mind", "silva_mirror_of_mind"],
      formats: ["image", "video", "meditation"],
    },
    {
      intent: "reframe_or_principle",
      methods: ["psycho_cybernetics_self_image", "self_affirmation", "woop_mental_contrasting"],
      formats: ["carousel", "image"],
    },
    {
      intent: "motion",
      methods: ["mental_rehearsal", "identity_based_habits"],
      formats: ["video", "image"],
    },
    {
      intent: "self_efficacy",
      methods: ["self_efficacy", "habit_loop", "identity_based_habits"],
      formats: ["carousel", "affirmation"],
    },
  ],
  evening: [
    {
      intent: "reflection",
      methods: ["self_efficacy", "psycho_cybernetics_theater_of_mind", "identity_based_habits"],
      formats: ["carousel", "affirmation"],
    },
    {
      intent: "gratitude_callback",
      methods: ["gratitude_neuroscience"],
      formats: ["affirmation", "image"],
    },
    {
      intent: "meditation",
      methods: ["silva_mirror_of_mind", "mental_rehearsal", "gratitude_neuroscience"],
      formats: ["meditation"],
    },
    {
      intent: "tomorrow_intention",
      methods: ["implementation_intentions"],
      formats: ["affirmation", "video", "image"],
    },
  ],
};

/** Intensity that fits each part of the day. Evening never goes intense. */
const INTENSITY_FIT: Record<TimeOfDay, Record<Intensity, number>> = {
  morning: { gentle: 1, moderate: 1, intense: -0.5 },
  midday: { gentle: 0, moderate: 1, intense: 1 },
  evening: { gentle: 1, moderate: 0.5, intense: -1 },
};

export function currentTimeOfDay(date: Date = new Date()): TimeOfDay {
  const hour = date.getHours();
  if (hour < 11) return "morning";
  if (hour < 17) return "midday";
  return "evening";
}

// Deterministic per (user, day, item) jitter — the feed is stable for a day and
// different the next, without storing a shuffle order.
function hashJitter(...parts: string[]): number {
  let hash = 2166136261;
  const input = parts.join("|");
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 1000) / 1000; // 0..1
}

export interface ScoreContext {
  slot: TimeOfDay;
  role?: FeedRole;
  survey: SurveyData;
  seed: string;
}

export function scoreItem(item: ContentLibraryItem, context: ScoreContext): number {
  let score = 0;

  // Goal relevance. A piece written for one category the user picked is a
  // sharper match than one written for all four.
  const matches = item.goal_categories.filter((category) =>
    context.survey.goal_categories.includes(category)
  ).length;
  if (matches === 0) return -Infinity; // never serve content for goals they didn't pick
  score += 2 + 2 * (matches / item.goal_categories.length);

  // Time of day
  if (item.time_of_day_affinity === context.slot) score += 2.5;
  else if (item.time_of_day_affinity === "any") score += 0.5;
  else score -= 2;

  // Role fit
  if (context.role) {
    if (item.method_tags.some((tag) => context.role!.methods.includes(tag))) score += 2;
    if (context.role.formats.includes(item.type)) score += 1.5;
  }

  // Prefer pieces that will read in the user's own words
  score += 1.5 * personalizationDensity(context.survey, item.personalization_variables);

  // Length preference
  const [min, max] = LENGTH_PREF_SECONDS[context.survey.content_length_pref];
  if (item.duration_seconds !== null) {
    if (item.duration_seconds >= min && item.duration_seconds <= max) score += 1;
    else if (context.survey.content_length_pref !== "mix") score -= 1;
  }

  // Premium (deep) pieces only when the user wants depth
  if (item.is_premium && context.survey.content_length_pref === "quick") score -= 2;

  // Intensity pacing
  score += INTENSITY_FIT[context.slot][item.intensity];

  // Stable jitter so ties don't always resolve the same way
  score += hashJitter(context.seed, item.id) * 0.9;

  return score;
}

export interface FeedSelection {
  source: "library" | "generated";
  /** library id, or generated_content uuid */
  id: string;
  position: number;
  intent: string;
}

export interface BuildFeedOptions {
  survey: SurveyData;
  slot: TimeOfDay;
  /** Ready personalized pieces; the freshest are woven into the top of the feed. */
  generated?: GeneratedContent[];
  /** Library ids already served recently — avoided unless the pool runs dry. */
  excludeIds?: string[];
  count?: number;
  /** Anything stable per user per day, e.g. `${userId}:${date}`. */
  seed?: string;
}

/**
 * Picks an ordered slice of content for one time slot. Personalized pieces go
 * at positions 1 and 4 (seen early, but not so early the feed stops feeling
 * curated); library pieces fill the rhythm around them.
 */
export function buildFeed(options: BuildFeedOptions): FeedSelection[] {
  const { survey, slot, generated = [], excludeIds = [], count = 6, seed = slot } = options;

  const generatedPositions = [1, 4].filter((position) => position < count);
  const generatedSlots = new Set(generatedPositions);
  const usableGenerated = generated
    .filter((item) => item.status === "ready")
    .slice(0, generatedPositions.length);

  const roles = FEED_RHYTHM[slot];
  const used = new Set<string>();
  const selections: FeedSelection[] = [];

  const excluded = new Set(excludeIds);
  const eligible = contentLibrary.filter((item) => !excluded.has(item.id));
  // If a week of feeds has drained the pool, allow repeats rather than a short feed.
  const pool = eligible.length >= count ? eligible : contentLibrary;

  let generatedIndex = 0;
  let roleIndex = 0;

  for (let position = 0; position < count; position++) {
    if (generatedSlots.has(position) && generatedIndex < usableGenerated.length) {
      const item = usableGenerated[generatedIndex++];
      selections.push({
        source: "generated",
        id: item.id,
        position,
        intent: "personalized",
      });
      continue;
    }

    const role = roles[roleIndex % roles.length];
    roleIndex++;

    const context: ScoreContext = { slot, role, survey, seed };

    let best: ContentLibraryItem | null = null;
    let bestScore = -Infinity;
    for (const item of pool) {
      if (used.has(item.id)) continue;
      const score = scoreItem(item, context);
      if (score > bestScore) {
        bestScore = score;
        best = item;
      }
    }

    if (!best) break;
    used.add(best.id);
    selections.push({ source: "library", id: best.id, position, intent: role.intent });
  }

  return selections;
}
