// IDSHIFT — personalized content generation
//
// Two or three pieces are generated per user per day and woven into the feed
// alongside the curated library. Text runs through fal's LLM router; images run
// through flux (with the user's photo as a likeness reference when they gave
// one). Without FAL_KEY every generator falls back to a deterministic
// template-built piece so the product is still whole in local dev — those
// pieces are marked `mock: true` in generation_prompt and never claim to
// carry generated media.

import type {
  BenefitTag,
  ContentData,
  ContentFormat,
  GenerationStatus,
  MethodTag,
  SurveyData,
} from "@/types";
import { buildVariableMap, fillVariables } from "@/lib/content/personalize";
import { buildImagePrompt } from "./visual-style";
import { generateImage, generateText, isFalConfigured } from "./fal";

export interface GeneratedDraft {
  type: ContentFormat;
  title: string;
  content_data: ContentData;
  generation_prompt: Record<string, unknown>;
  benefit_tag: BenefitTag;
  science_ref: string;
  method_tags: MethodTag[];
  status: GenerationStatus;
  duration_seconds: number | null;
}

const AFFIRMATION_SYSTEM = `You write single-sentence affirmations for an identity-shift app.

Rules:
- Present tense, first person, stated as fact. Never "I will" or "I want".
- Speak to who the person IS, not what they should DO.
- Use the person's own words where you can. Plain language, no mysticism.
- Never mention manifestation, the universe, attraction, or any named method.
- One sentence, under 20 words. Return only the sentence, no quotes.`;

const REFRAME_SYSTEM = `You rewrite limiting beliefs for an identity-shift app.

Rules:
- Acknowledge the belief is understandable, then state the accurate version.
- Ground it in evidence the person already has. Never argue, never cheerlead.
- Two sentences maximum. Plain language, no mysticism, no named methods.
- Return only the reframe.`;

export async function generateDailyAffirmation(survey: SurveyData): Promise<GeneratedDraft> {
  const variables = buildVariableMap(survey);
  const prompt = [
    `Who they are becoming: ${variables.future_identity}`,
    `Their daily habit: ${variables.daily_habit}`,
    `What gets in the way: ${variables.inner_obstacle}`,
    `Write today's affirmation for them.`,
  ].join("\n");

  if (!isFalConfigured()) {
    return {
      type: "affirmation",
      title: "Today's line",
      content_data: {
        affirmation: fillVariables(
          "I am {{future_identity}}, and today I {{daily_habit}}.",
          variables
        ),
        text: "Say it once now, and again when the day pushes back.",
      },
      generation_prompt: { mock: true, prompt },
      benefit_tag: "Rewires self-image",
      science_ref: "Self-affirmation research (Cascio et al., 2016)",
      method_tags: ["self_affirmation", "identity_based_habits"],
      status: "ready",
      duration_seconds: 20,
    };
  }

  const affirmation = await generateText({ prompt, systemPrompt: AFFIRMATION_SYSTEM });

  return {
    type: "affirmation",
    title: "Today's line",
    content_data: {
      affirmation,
      text: "Say it once now, and again when the day pushes back.",
    },
    generation_prompt: { model: "text", system: AFFIRMATION_SYSTEM, prompt },
    benefit_tag: "Rewires self-image",
    science_ref: "Self-affirmation research (Cascio et al., 2016)",
    method_tags: ["self_affirmation", "identity_based_habits"],
    status: "ready",
    duration_seconds: 20,
  };
}

export async function generateBeliefReframe(survey: SurveyData): Promise<GeneratedDraft> {
  const variables = buildVariableMap(survey);
  const prompt = [
    `The belief they repeat: "${variables.limiting_belief}"`,
    `Who they are becoming: ${variables.future_identity}`,
    `Evidence they already have: ${variables.gratitude_self}`,
    `Write the reframe.`,
  ].join("\n");

  const fallback = fillVariables(
    "“{{limiting_belief}}” made sense from where you used to stand. From here, the accurate version is simpler: {{gratitude_self}}, and that is the same person who becomes {{future_identity}}.",
    variables
  );

  const text = isFalConfigured()
    ? await generateText({ prompt, systemPrompt: REFRAME_SYSTEM })
    : fallback;

  return {
    type: "affirmation",
    title: "The old line, rewritten",
    content_data: {
      affirmation: text,
      text: "Catch the old sentence once today. Replace it on the spot.",
    },
    generation_prompt: isFalConfigured()
      ? { model: "text", system: REFRAME_SYSTEM, prompt }
      : { mock: true, prompt },
    benefit_tag: "Reframes limiting beliefs",
    science_ref: "Cognitive reframing; self-affirmation (Cascio et al., 2016)",
    method_tags: ["psycho_cybernetics_self_image", "self_affirmation"],
    status: "ready",
    duration_seconds: 30,
  };
}

/**
 * An image of the user inside the scene they described. Without a fal key (or a
 * reference photo) this still produces a card — it just carries the scene as
 * type rather than as a picture.
 */
export async function generateIdentityImage(
  survey: SurveyData,
  referenceImageUrl?: string
): Promise<GeneratedDraft> {
  const variables = buildVariableMap(survey);
  const scene = variables.dream_scene;
  const prompt = buildImagePrompt(
    referenceImageUrl ? `${scene}, featuring the person in the reference photo` : scene,
    survey.visual_mood
  );

  const draft: GeneratedDraft = {
    type: "image",
    title: "The scene you described",
    content_data: {
      text: scene,
      image_prompt: prompt,
      prompt: "Add one sense the picture doesn't have. What do you hear?",
    },
    generation_prompt: { model: "image", prompt, reference: Boolean(referenceImageUrl) },
    benefit_tag: "Activates mental rehearsal",
    science_ref: "Mental practice produces cortical change (Pascual-Leone et al., 1995)",
    method_tags: ["mental_rehearsal", "silva_mirror_of_mind"],
    status: "ready",
    duration_seconds: null,
  };

  if (!isFalConfigured()) {
    return { ...draft, generation_prompt: { ...draft.generation_prompt, mock: true } };
  }

  const image = await generateImage({ prompt, referenceImageUrl, aspectRatio: "4:5" });
  return { ...draft, content_data: { ...draft.content_data, image_url: image.url } };
}

/**
 * The daily refresh: 2-3 personalized pieces. Generators are independent, so
 * one failing model doesn't cost the user the whole refresh.
 */
export async function generateDailyBatch(
  survey: SurveyData,
  options: { referenceImageUrl?: string; count?: number } = {}
): Promise<{ drafts: GeneratedDraft[]; errors: string[] }> {
  const generators = [
    () => generateDailyAffirmation(survey),
    () => generateIdentityImage(survey, options.referenceImageUrl),
    () => generateBeliefReframe(survey),
  ].slice(0, options.count ?? 3);

  const results = await Promise.allSettled(generators.map((run) => run()));

  return {
    drafts: results
      .filter((result): result is PromiseFulfilledResult<GeneratedDraft> => result.status === "fulfilled")
      .map((result) => result.value),
    errors: results
      .filter((result): result is PromiseRejectedResult => result.status === "rejected")
      .map((result) => String(result.reason)),
  };
}
