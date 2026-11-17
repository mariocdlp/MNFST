// IDSHIFT — Core type definitions
// All types map to the database schema and survey variable system

export type GoalCategory =
  | "career_money"
  | "health_fitness"
  | "love_relationships"
  | "creative_purpose";

export type DreamEmotion =
  | "joy"
  | "pride"
  | "freedom"
  | "peace"
  | "power"
  | "love"
  | "relief"
  | "excitement"
  | "gratitude"
  | "confidence";

export type Timeline = "3_months" | "6_months" | "1_year" | "3_years" | "5_years";

export type InnerObstacle =
  | "fear_of_failure"
  | "self_doubt"
  | "procrastination"
  | "lack_of_discipline"
  | "fear_of_judgment"
  | "perfectionism"
  | "past_trauma"
  | "overwhelm"
  | "other";

export type Gender = "male" | "female" | "non_binary" | "prefer_not_to_say";

export type VisualMood = "warm_cinematic" | "clean_modern" | "dark_dramatic";
export type VoicePreference = "male" | "female" | "none";
export type MusicEnergy = "calm_ambient" | "uplifting_emotional" | "powerful_driving";

export type ContentLengthPref = "quick" | "medium" | "deep" | "mix";

export type ActionType = "daily_habit" | "if_then_plan" | "first_step";
export type CompletionStatus = "done" | "skipped" | "partial";
export type NotificationType =
  | "morning_reminder"
  | "evening_checkin"
  | "streak_milestone"
  | "weekly_summary"
  | "content_ready"
  | "meditation_ready"
  | "nudge";

// Survey response data — all 22+ fields from the intake form
export interface SurveyData {
  // Step 1: Identity
  first_name: string;
  current_identity: string;
  occupation: string;
  gender: Gender;

  // Step 2: Dream
  goal_categories: GoalCategory[];
  dream_description: string;
  dream_scene: string;
  dream_emotions: DreamEmotion[];
  timeline: Timeline;

  // Step 3: Gratitude
  gratitude_personal_1: string;
  gratitude_personal_2: string;
  gratitude_personal_3: string;
  gratitude_self: string;

  // Step 4: Obstacles
  inner_obstacle: InnerObstacle;
  inner_obstacle_other?: string;
  external_obstacle: string;
  limiting_belief: string;

  // Step 5: Implementation
  future_identity: string;
  daily_habit: string;
  first_step: string;
  if_time: string;
  then_action: string;
  ideal_routine: string;

  // Step 6: Preferences
  visual_mood: VisualMood;
  voice_pref: VoicePreference;
  music_energy: MusicEnergy;
  content_length_pref: ContentLengthPref;
}

export interface User {
  id: string;
  email: string;
  name: string;
  credits_remaining: number;
  created_at: string;
}

export interface SurveyResponse {
  id: string;
  user_id: string;
  response_data: SurveyData;
  created_at: string;
}

export interface UserPhoto {
  id: string;
  user_id: string;
  photo_url: string;
  photo_type: "face_front" | "face_angle" | "full_body";
  uploaded_at: string;
}

export interface ActionPledge {
  id: string;
  user_id: string;
  survey_response_id: string | null;
  action_type: ActionType;
  action_text: string;
  pledged_at: string;
  is_active: boolean;
}

export interface ActionCompletion {
  id: string;
  pledge_id: string;
  date: string;
  status: CompletionStatus;
  reflection_text: string | null;
  completed_at: string;
}

export interface Streak {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_completion_date: string | null;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface NotificationPreferences {
  user_id: string;
  morning_reminder_time: string;
  evening_checkin_time: string;
  email_morning_reminder: boolean;
  email_evening_checkin: boolean;
  email_weekly_summary: boolean;
  email_content_ready: boolean;
  in_app_morning_reminder: boolean;
  in_app_evening_checkin: boolean;
  in_app_streak_milestone: boolean;
  in_app_weekly_summary: boolean;
  in_app_content_ready: boolean;
}

// Pronoun helper derived from gender
export function getPronoun(gender: Gender): string {
  switch (gender) {
    case "male": return "him";
    case "female": return "her";
    case "non_binary": return "them";
    default: return "them";
  }
}

export function getSubjectPronoun(gender: Gender): string {
  switch (gender) {
    case "male": return "he";
    case "female": return "she";
    case "non_binary": return "they";
    default: return "they";
  }
}

// ---------------------------------------------------------------------------
// Content system
// ---------------------------------------------------------------------------

export type ContentFormat = "image" | "carousel" | "video" | "meditation" | "affirmation";
export type Intensity = "gentle" | "moderate" | "intense";
export type TimeOfDay = "morning" | "midday" | "evening";
export type TimeAffinity = TimeOfDay | "any";
export type ContentSource = "library" | "generated";
export type GenerationStatus = "queued" | "generating" | "ready" | "failed";

// Internal methodology tags — never rendered to the user. They exist so the
// feed can balance which technique a user is being served, and so generated
// content can be traced back to the method it draws from.
export type MethodTag =
  | "silva_mirror_of_mind"
  | "psycho_cybernetics_self_image"
  | "psycho_cybernetics_theater_of_mind"
  | "woop_mental_contrasting"
  | "implementation_intentions"
  | "identity_based_habits"
  | "habit_loop"
  | "gratitude_neuroscience"
  | "mental_rehearsal"
  | "self_affirmation"
  | "self_efficacy";

// User-facing benefit labels — always visible on the card.
export type BenefitTag =
  | "Rewires self-image"
  | "Builds neural pathways"
  | "Strengthens daily habits"
  | "Activates reward circuitry"
  | "Reframes limiting beliefs"
  | "Deepens identity shift"
  | "Primes subconscious mind"
  | "Strengthens implementation intentions"
  | "Builds self-efficacy"
  | "Activates mental rehearsal";

export interface CarouselSlide {
  text: string;
  caption?: string;
  image_url?: string;
  image_prompt?: string;
}

// Shape of content_data, by format. Every field is optional at the type level
// because a single JSONB column carries all five formats.
export interface ContentData {
  /** image, video, meditation: headline rendered over the media */
  text?: string;
  /** affirmation: the line the user repeats */
  affirmation?: string;
  /** carousel */
  slides?: CarouselSlide[];
  /** image / video poster */
  image_url?: string;
  image_prompt?: string;
  video_url?: string;
  audio_url?: string;
  /** meditation: which protocol sections this piece runs */
  sections?: MeditationSection[];
  /** meditation: the same sections, personalized and timed at read time */
  sections_detail?: MeditationSectionDetail[];
  /** evening reflection prompt shown under the content */
  prompt?: string;
  /** ambient bed for meditation + affirmation audio */
  music_bed?: string;
}

export interface MeditationSectionDetail {
  id: MeditationSection;
  label: string;
  guidance: string;
  seconds: number;
}

export type MeditationSection =
  | "induction"
  | "gratitude_priming"
  | "identity_visualization"
  | "mental_contrasting"
  | "action_rehearsal"
  | "integration";

export interface ContentLibraryItem {
  id: string;
  type: ContentFormat;
  title: string;
  content_data: ContentData;
  benefit_tag: BenefitTag;
  science_ref: string;
  method_tags: MethodTag[];
  goal_categories: GoalCategory[];
  personalization_variables: string[];
  intensity: Intensity;
  time_of_day_affinity: TimeAffinity;
  duration_seconds: number | null;
  is_premium: boolean;
}

export interface GeneratedContent {
  id: string;
  user_id: string;
  type: ContentFormat;
  title: string;
  content_data: ContentData;
  generation_prompt: Record<string, unknown>;
  benefit_tag: BenefitTag;
  science_ref: string;
  method_tags: MethodTag[];
  status: GenerationStatus;
  source: "system_generated" | "user_created";
  credits_spent: number;
  duration_seconds: number | null;
  created_at: string;
}

export interface UserFeedRow {
  id: string;
  user_id: string;
  content_source: ContentSource;
  library_content_id: string | null;
  generated_content_id: string | null;
  time_slot: TimeAffinity;
  feed_date: string;
  position: number;
  served_at: string;
  viewed: boolean;
  viewed_at: string | null;
  saved: boolean;
  completed: boolean;
}

// What the feed API hands the client: one resolved, personalized card.
export interface FeedCard {
  /** user_feed row id, null for a preview that was never persisted */
  feed_id: string | null;
  content_id: string;
  source: ContentSource;
  type: ContentFormat;
  title: string;
  content_data: ContentData;
  benefit_tag: BenefitTag;
  science_ref: string;
  goal_categories: GoalCategory[];
  intensity: Intensity;
  time_slot: TimeAffinity;
  duration_seconds: number | null;
  viewed: boolean;
  saved: boolean;
  completed: boolean;
}

export interface UserMeditation {
  id: string;
  user_id: string;
  generated_content_id: string | null;
  title: string;
  audio_url: string | null;
  duration_seconds: number;
  focus_area: string;
  mood: string;
  created_at: string;
  listen_count: number;
  last_listened_at: string | null;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  reason: "signup_bonus" | "meditation_created" | "purchase" | "refund";
  created_at: string;
}

export const GOAL_CATEGORY_LABELS: Record<GoalCategory, string> = {
  career_money: "Career & Money",
  health_fitness: "Health & Fitness",
  love_relationships: "Love & Relationships",
  creative_purpose: "Creative & Purpose",
};

// How long a card should feel, per the user's length preference.
export const LENGTH_PREF_SECONDS: Record<ContentLengthPref, [number, number]> = {
  quick: [0, 60],
  medium: [60, 180],
  deep: [180, 600],
  mix: [0, 600],
};
