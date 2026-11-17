// IDSHIFT — curated content library
//
// library.json is the canonical copy: it is version-controlled with the app, so
// the feed can be built without a database round trip and works in local dev
// with no Supabase project. `npm run seed:content` mirrors it into the
// public.content_library table for SQL-side querying and future CMS work.

import raw from "./library.json";
import type { ContentFormat, ContentLibraryItem, GoalCategory, MethodTag, TimeAffinity } from "@/types";

export const contentLibrary = raw as ContentLibraryItem[];

const byId = new Map(contentLibrary.map((item) => [item.id, item]));

export function getLibraryItem(id: string): ContentLibraryItem | null {
  return byId.get(id) ?? null;
}

export function getLibraryItems(ids: string[]): ContentLibraryItem[] {
  return ids.map((id) => byId.get(id)).filter((item): item is ContentLibraryItem => Boolean(item));
}

export interface LibraryFilter {
  formats?: ContentFormat[];
  goalCategories?: GoalCategory[];
  methodTags?: MethodTag[];
  timeAffinity?: TimeAffinity[];
  maxDurationSeconds?: number;
  excludeIds?: string[];
}

export function filterLibrary(filter: LibraryFilter = {}): ContentLibraryItem[] {
  const exclude = new Set(filter.excludeIds ?? []);

  return contentLibrary.filter((item) => {
    if (exclude.has(item.id)) return false;
    if (filter.formats && !filter.formats.includes(item.type)) return false;
    if (filter.timeAffinity && !filter.timeAffinity.includes(item.time_of_day_affinity)) return false;
    if (
      filter.goalCategories &&
      !item.goal_categories.some((category) => filter.goalCategories!.includes(category))
    ) {
      return false;
    }
    if (filter.methodTags && !item.method_tags.some((tag) => filter.methodTags!.includes(tag))) {
      return false;
    }
    if (
      filter.maxDurationSeconds !== undefined &&
      item.duration_seconds !== null &&
      item.duration_seconds > filter.maxDurationSeconds
    ) {
      return false;
    }
    return true;
  });
}
