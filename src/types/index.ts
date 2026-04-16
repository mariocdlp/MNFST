// MNFST — Core type definitions
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
  | "gratitude";

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

export type VideoStatus = "queued" | "generating" | "completed" | "failed";
export type ActionType = "daily_habit" | "if_then_plan" | "first_step";
export type CompletionStatus = "done" | "skipped" | "partial";
export type NotificationType =
  | "morning_reminder"
  | "evening_checkin"
  | "streak_milestone"
  | "weekly_summary"
  | "video_ready";

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

export interface Video {
  id: string;
  user_id: string;
  survey_response_id: string;
  template_id: string;
  vibe_id: string;
  status: VideoStatus;
  video_url: string | null;
  thumbnail_url: string | null;
  generation_started_at: string | null;
  generation_completed_at: string | null;
  created_at: string;
}

export interface ActionPledge {
  id: string;
  user_id: string;
  video_id: string;
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
  email_video_ready: boolean;
  in_app_morning_reminder: boolean;
  in_app_evening_checkin: boolean;
  in_app_streak_milestone: boolean;
  in_app_weekly_summary: boolean;
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
