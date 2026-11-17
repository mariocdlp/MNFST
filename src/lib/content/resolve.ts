// Turns stored feed rows + content records into the personalized cards the
// client renders. Personalization happens here, at read time, so a change to a
// user's survey answers is reflected the next time they open the feed.

import type {
  ContentData,
  ContentLibraryItem,
  FeedCard,
  GeneratedContent,
  SurveyData,
  UserFeedRow,
} from "@/types";
import { buildVariableMap, personalizeContentData } from "./personalize";
import { expandSections } from "./meditation-sections";
import { getLibraryItem } from "./library";

/** Meditations carry a timed, personalized walkthrough instead of raw sections. */
function withSectionDetail(
  data: ContentData,
  survey: SurveyData,
  durationSeconds: number | null
): ContentData {
  if (!data.sections?.length) return data;
  return {
    ...data,
    sections_detail: expandSections(data.sections, durationSeconds ?? 300, survey),
  };
}

export function libraryCard(
  item: ContentLibraryItem,
  survey: SurveyData,
  row?: Partial<UserFeedRow>
): FeedCard {
  const variables = buildVariableMap(survey);

  return {
    feed_id: row?.id ?? null,
    content_id: item.id,
    source: "library",
    type: item.type,
    title: item.title,
    content_data: withSectionDetail(
      personalizeContentData(item.content_data, variables),
      survey,
      item.duration_seconds
    ),
    benefit_tag: item.benefit_tag,
    science_ref: item.science_ref,
    goal_categories: item.goal_categories,
    intensity: item.intensity,
    time_slot: row?.time_slot ?? item.time_of_day_affinity,
    duration_seconds: item.duration_seconds,
    viewed: row?.viewed ?? false,
    saved: row?.saved ?? false,
    completed: row?.completed ?? false,
  };
}

export function generatedCard(
  item: GeneratedContent,
  survey: SurveyData,
  row?: Partial<UserFeedRow>
): FeedCard {
  const variables = buildVariableMap(survey);

  return {
    feed_id: row?.id ?? null,
    content_id: item.id,
    source: "generated",
    type: item.type,
    title: item.title,
    content_data: withSectionDetail(
      personalizeContentData(item.content_data, variables),
      survey,
      item.duration_seconds
    ),
    benefit_tag: item.benefit_tag,
    science_ref: item.science_ref,
    goal_categories: survey.goal_categories,
    intensity: "moderate",
    time_slot: row?.time_slot ?? "any",
    duration_seconds: item.duration_seconds,
    viewed: row?.viewed ?? false,
    saved: row?.saved ?? false,
    completed: row?.completed ?? false,
  };
}

/** Resolves stored rows in their stored order, dropping anything deleted. */
export function resolveFeedRows(
  rows: UserFeedRow[],
  generated: GeneratedContent[],
  survey: SurveyData
): FeedCard[] {
  const generatedById = new Map(generated.map((item) => [item.id, item]));

  return rows
    .map((row) => {
      if (row.content_source === "library" && row.library_content_id) {
        const item = getLibraryItem(row.library_content_id);
        return item ? libraryCard(item, survey, row) : null;
      }
      if (row.content_source === "generated" && row.generated_content_id) {
        const item = generatedById.get(row.generated_content_id);
        return item ? generatedCard(item, survey, row) : null;
      }
      return null;
    })
    .filter((card): card is FeedCard => card !== null);
}
