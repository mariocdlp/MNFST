// IDSHIFT — personalization variable injection
//
// Library pieces are authored with {{variables}}. This module resolves them
// against a user's survey answers. Two rules matter:
//   1. Never leave a raw {{token}} on screen — every variable has a fallback
//      that still reads as a complete, identity-first sentence.
//   2. Enum answers become natural language ("self_doubt" -> "self-doubt"),
//      because the copy reads them mid-sentence.

import type { ContentData, InnerObstacle, SurveyData, Timeline, VisualMood } from "@/types";

const INNER_OBSTACLE_TEXT: Record<InnerObstacle, string> = {
  fear_of_failure: "the fear of failing",
  self_doubt: "self-doubt",
  procrastination: "procrastination",
  lack_of_discipline: "the pull to skip it",
  fear_of_judgment: "the fear of being judged",
  perfectionism: "perfectionism",
  past_trauma: "what happened before",
  overwhelm: "overwhelm",
  other: "the thing that keeps stopping you",
};

const TIMELINE_TEXT: Record<Timeline, string> = {
  "3_months": "three months",
  "6_months": "six months",
  "1_year": "a year",
  "3_years": "three years",
  "5_years": "five years",
};

const VISUAL_MOOD_TEXT: Record<VisualMood, string> = {
  warm_cinematic: "warm cinematic",
  clean_modern: "clean and modern",
  dark_dramatic: "dark and dramatic",
};

/** Variable name (without braces) -> resolved text for this user. */
export function buildVariableMap(survey: SurveyData): Record<string, string> {
  const obstacle =
    survey.inner_obstacle === "other" && survey.inner_obstacle_other?.trim()
      ? survey.inner_obstacle_other.trim()
      : INNER_OBSTACLE_TEXT[survey.inner_obstacle];

  return {
    first_name: survey.first_name || "friend",
    current_identity: survey.current_identity || "someone in the middle of changing",
    occupation: survey.occupation || "your work",
    future_identity: survey.future_identity || "the person who follows through",
    dream_description: survey.dream_description || "the life you described",
    dream_scene: survey.dream_scene || "the moment you're working toward",
    daily_habit: survey.daily_habit || "show up for the one thing",
    first_step: survey.first_step || "the smallest version of it",
    ideal_routine: survey.ideal_routine || "the day that belongs to that person",
    if_time: survey.if_time || "your set time",
    then_action: survey.then_action || "your one action",
    limiting_belief: survey.limiting_belief || "I'm not the kind of person who does this",
    inner_obstacle: obstacle,
    external_obstacle: survey.external_obstacle || "what's outside your control",
    gratitude_1: survey.gratitude_personal_1 || "what's already going right",
    gratitude_2: survey.gratitude_personal_2 || "the people around you",
    gratitude_3: survey.gratitude_personal_3 || "the chance to start again today",
    gratitude_self: survey.gratitude_self || "you keep going",
    timeline: TIMELINE_TEXT[survey.timeline] ?? "the time you gave yourself",
    visual_mood: VISUAL_MOOD_TEXT[survey.visual_mood] ?? "warm cinematic",
    // Only ever used inside generation prompts, never rendered as copy.
    user_likeness: "the user",
  };
}

const TOKEN = /\{\{([a-z_0-9]+)\}\}/g;

export function fillVariables(text: string, variables: Record<string, string>): string {
  return text.replace(TOKEN, (match, name: string) => variables[name] ?? match);
}

/** Deep-fills every string in a content_data payload. */
export function personalizeContentData(
  data: ContentData,
  variables: Record<string, string>
): ContentData {
  const walk = (value: unknown): unknown => {
    if (typeof value === "string") return fillVariables(value, variables);
    if (Array.isArray(value)) return value.map(walk);
    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([key, inner]) => [key, walk(inner)])
      );
    }
    return value;
  };

  return walk(data) as ContentData;
}

/** Variable names the user actually answered, i.e. not filled from a fallback. */
export function answeredVariables(survey: SurveyData): Set<string> {
  const answered = new Set<string>();
  const add = (name: string, value: string | undefined) => {
    if (value?.trim()) answered.add(name);
  };

  add("first_name", survey.first_name);
  add("current_identity", survey.current_identity);
  add("occupation", survey.occupation);
  add("future_identity", survey.future_identity);
  add("dream_description", survey.dream_description);
  add("dream_scene", survey.dream_scene);
  add("daily_habit", survey.daily_habit);
  add("first_step", survey.first_step);
  add("ideal_routine", survey.ideal_routine);
  add("if_time", survey.if_time);
  add("then_action", survey.then_action);
  add("limiting_belief", survey.limiting_belief);
  add("external_obstacle", survey.external_obstacle);
  add("gratitude_1", survey.gratitude_personal_1);
  add("gratitude_2", survey.gratitude_personal_2);
  add("gratitude_3", survey.gratitude_personal_3);
  add("gratitude_self", survey.gratitude_self);
  // Always present: these come from single-select steps with a default.
  answered.add("inner_obstacle");
  answered.add("timeline");
  answered.add("visual_mood");

  return answered;
}

/**
 * How much of a piece is genuinely this user's words, 0..1. A piece with no
 * variables at all is neutral (1) — it was written to stand on its own.
 */
export function personalizationDensity(survey: SurveyData, variables: string[]): number {
  if (variables.length === 0) return 1;
  const answered = answeredVariables(survey);
  const filled = variables.filter((token) =>
    answered.has(token.replaceAll("{", "").replaceAll("}", ""))
  ).length;
  return filled / variables.length;
}
