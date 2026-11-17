// The three commitments the intake produces. Order matters: it's the order they
// appear on the action plan and the dashboard.

import type { ActionType, SurveyData } from "@/types";

export const ACTION_TYPES: ActionType[] = ["daily_habit", "if_then_plan", "first_step"];

export const ACTION_LABELS: Record<ActionType, string> = {
  daily_habit: "Daily habit",
  if_then_plan: "If-then plan",
  first_step: "First step",
};

export function pledgeTextFor(type: ActionType, survey: SurveyData): string {
  switch (type) {
    case "daily_habit":
      return survey.daily_habit;
    case "if_then_plan":
      return survey.if_time && survey.then_action
        ? `If it is ${survey.if_time}, then I will ${survey.then_action}`
        : "";
    case "first_step":
      return survey.first_step;
  }
}
