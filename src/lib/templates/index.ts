import universalV1, { type Template, type Vibe } from "./universal-v1";

// Template registry — add new templates here
const templates: Record<string, Template> = {
  universal_v1: universalV1,
};

export function getTemplate(templateId: string): Template | null {
  return templates[templateId] ?? null;
}

export function getVibe(templateId: string, vibeId: string): Vibe | null {
  const template = getTemplate(templateId);
  if (!template) return null;
  return template.vibes.find((v) => v.vibe_id === vibeId) ?? null;
}

export function getAllTemplates(): Template[] {
  return Object.values(templates);
}

export function getVibeOptions(): { id: string; name: string; description: string }[] {
  return universalV1.vibes.map((v) => ({
    id: v.vibe_id,
    name: v.name,
    description: v.description,
  }));
}

export type { Template, Vibe };
