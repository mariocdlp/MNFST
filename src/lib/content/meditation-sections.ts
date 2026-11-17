// The six-section protocol, as a timed walkthrough.
//
// A meditation piece declares which sections it runs; this module turns that
// into timed, personalized steps. The user sees plain instructions — settle,
// appreciate, see it, face it, rehearse, return — and never the name of the
// method any section comes from.

import type { MeditationSection, MeditationSectionDetail, SurveyData } from "@/types";
import { buildVariableMap, fillVariables } from "./personalize";

interface SectionTemplate {
  label: string;
  /** Relative share of the piece's total duration. */
  weight: number;
  guidance: string;
}

const SECTIONS: Record<MeditationSection, SectionTemplate> = {
  induction: {
    label: "Settle",
    weight: 1,
    guidance:
      "Close your eyes. Breathe out for longer than you breathe in. Nothing to solve for the next few minutes.",
  },
  gratitude_priming: {
    label: "Appreciate",
    weight: 1,
    guidance:
      "Bring up {{gratitude_1}}. Stay with it until it stops being a word. Then {{gratitude_2}}, then {{gratitude_3}}.",
  },
  identity_visualization: {
    label: "See it",
    weight: 3,
    guidance:
      "Put the moment on a screen in front of you: {{dream_scene}}. Watch it once from outside. Now step in — same scene, your eyes, your hands. This is a person who is {{future_identity}}.",
  },
  mental_contrasting: {
    label: "Face it",
    weight: 1.5,
    guidance:
      "Now the honest part. {{inner_obstacle}} is going to show up, and so is {{external_obstacle}}. Look straight at both. They're the terrain, not a verdict.",
  },
  action_rehearsal: {
    label: "Rehearse",
    weight: 2.5,
    guidance:
      "Run tomorrow: it's {{if_time}}, and you {{then_action}}. See yourself doing {{daily_habit}} start to finish — the boring middle included. Say it as it already is: I am {{future_identity}}.",
  },
  integration: {
    label: "Return",
    weight: 1,
    guidance:
      "Come back slowly. Count up from one to five, getting more awake with each number. One action today: {{first_step}}. Open your eyes. You know what to do.",
  },
};

export const SECTION_ORDER: MeditationSection[] = [
  "induction",
  "gratitude_priming",
  "identity_visualization",
  "mental_contrasting",
  "action_rehearsal",
  "integration",
];

/**
 * Expands a meditation's declared sections into personalized, timed steps that
 * add up to `totalSeconds`.
 */
export function expandSections(
  sections: MeditationSection[],
  totalSeconds: number,
  survey: SurveyData
): MeditationSectionDetail[] {
  const ordered = SECTION_ORDER.filter((section) => sections.includes(section));
  if (ordered.length === 0) return [];

  const variables = buildVariableMap(survey);
  const totalWeight = ordered.reduce((sum, section) => sum + SECTIONS[section].weight, 0);

  return ordered.map((section) => ({
    id: section,
    label: SECTIONS[section].label,
    guidance: fillVariables(SECTIONS[section].guidance, variables),
    seconds: Math.max(15, Math.round((SECTIONS[section].weight / totalWeight) * totalSeconds)),
  }));
}
