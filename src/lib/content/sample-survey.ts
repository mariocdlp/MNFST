// DEV ONLY. Used to render a preview feed when the app runs without Supabase
// credentials, so the content system can be worked on without a project set up.
// Routes only reach for this when isSupabaseConfigured() is false, which cannot
// be true in a deployed environment.

import type { SurveyData } from "@/types";

export const sampleSurvey: SurveyData = {
  first_name: "Sam",
  current_identity: "Someone who starts a lot of things and finishes fewer of them",
  occupation: "product designer",
  gender: "prefer_not_to_say",
  goal_categories: ["career_money", "health_fitness"],
  dream_description:
    "I run my own small studio. The work is good, the clients trust me, and I stop at six because the day was enough.",
  dream_scene:
    "I'm presenting to a client in my own studio, calm and unhurried, and nobody in the room doubts me — least of all me.",
  dream_emotions: ["freedom", "pride", "peace"],
  timeline: "1_year",
  gratitude_personal_1: "my partner's patience",
  gratitude_personal_2: "work that I actually like",
  gratitude_personal_3: "a body that still shows up",
  gratitude_self: "I keep starting again",
  inner_obstacle: "self_doubt",
  external_obstacle: "not enough hours between work and family",
  limiting_belief: "People like me don't get to run their own thing",
  future_identity: "someone who finishes what they start and stays calm under pressure",
  daily_habit: "two focused hours on the studio before email",
  first_step: "open the file and write one line",
  if_time: "7:00am",
  then_action: "sit down and work on the studio for two hours",
  ideal_routine:
    "Up at six, water, walk, two hours of deep work, family breakfast, client calls in the afternoon, done by six.",
  visual_mood: "warm_cinematic",
  voice_pref: "female",
  music_energy: "uplifting_emotional",
  content_length_pref: "mix",
};
