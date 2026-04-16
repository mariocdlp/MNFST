// Video narration script template
// Variables in {{double_braces}} are replaced with user survey data
// Each section maps to the 6-phase video protocol

import { type SurveyData, getPronoun } from "@/types";

export interface ScriptSection {
  id: string;
  name: string;
  start_time: string;
  duration_seconds: number;
  narration_lines: { time: string; text: string; ssml_rate?: string }[];
  science_basis: string;
}

export interface GeneratedScript {
  sections: ScriptSection[];
  total_duration_seconds: number;
}

// Fill template variables from survey data
function fill(template: string, data: SurveyData): string {
  const pronoun = getPronoun(data.gender);
  const vars: Record<string, string> = {
    "{{first_name}}": data.first_name,
    "{{current_identity}}": data.current_identity,
    "{{occupation}}": data.occupation,
    "{{dream_description}}": data.dream_description,
    "{{dream_scene}}": data.dream_scene,
    "{{dream_emotions}}": data.dream_emotions.join(", "),
    "{{gratitude_personal_1}}": data.gratitude_personal_1,
    "{{gratitude_personal_2}}": data.gratitude_personal_2,
    "{{gratitude_personal_3}}": data.gratitude_personal_3,
    "{{gratitude_self}}": data.gratitude_self,
    "{{inner_obstacle}}": data.inner_obstacle === "other"
      ? (data.inner_obstacle_other ?? "your inner challenges")
      : data.inner_obstacle.replace(/_/g, " "),
    "{{external_obstacle}}": data.external_obstacle,
    "{{limiting_belief}}": data.limiting_belief,
    "{{future_identity}}": data.future_identity,
    "{{daily_habit}}": data.daily_habit,
    "{{first_step}}": data.first_step,
    "{{if_time}}": data.if_time,
    "{{then_action}}": data.then_action,
    "{{ideal_routine}}": data.ideal_routine,
    "{{pronoun}}": pronoun,
  };

  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(key, value);
  }
  return result;
}

export function generateScript(surveyData: SurveyData): GeneratedScript {
  const f = (t: string) => fill(t, surveyData);

  return {
    total_duration_seconds: 250,
    sections: [
      {
        id: "induction",
        name: "Induction / Alpha State",
        start_time: "00:00",
        duration_seconds: 35,
        science_basis: "Silva Method alpha state induction (José Silva); binaural beats research (Wahbeh et al., 2007)",
        narration_lines: [
          { time: "00:08", text: "Take a deep breath in...", ssml_rate: "slow" },
          { time: "00:14", text: "...and slowly let it go.", ssml_rate: "slow" },
          { time: "00:18", text: "Let your mind settle. Let everything else fade.", ssml_rate: "slow" },
          { time: "00:24", text: "With each breath, you're moving deeper into yourself...", ssml_rate: "slow" },
          { time: "00:30", text: "Into the space where change begins.", ssml_rate: "slow" },
        ],
      },
      {
        id: "gratitude",
        name: "Gratitude Priming",
        start_time: "00:35",
        duration_seconds: 30,
        science_basis: "Gratitude activates dopamine + serotonin (Zahn et al., 2008; Emmons & McCullough, 2003)",
        narration_lines: [
          { time: "00:36", text: "Before you look ahead... feel where you are right now.", ssml_rate: "medium" },
          { time: "00:42", text: "You already have so much.", ssml_rate: "medium" },
          { time: "00:45", text: f("{{gratitude_personal_1}}..."), ssml_rate: "medium" },
          { time: "00:48", text: f("{{gratitude_personal_2}}..."), ssml_rate: "medium" },
          { time: "00:51", text: f("{{gratitude_personal_3}}..."), ssml_rate: "medium" },
          { time: "00:55", text: f("And something about you that matters — {{gratitude_self}}."), ssml_rate: "medium" },
          { time: "01:00", text: "Feel that. Let it land.", ssml_rate: "medium" },
          { time: "01:03", text: "This is your foundation. You're not starting from nothing. You're building from here.", ssml_rate: "medium" },
        ],
      },
      {
        id: "dream_realized",
        name: "Dream Realized",
        start_time: "01:05",
        duration_seconds: 60,
        science_basis: "Mental rehearsal / functional equivalence (Pascual-Leone et al., 1995); Silva Method mental screen",
        narration_lines: [
          { time: "01:06", text: "Now... see it.", ssml_rate: "medium" },
          { time: "01:10", text: f("This is your life, {{first_name}}."), ssml_rate: "medium" },
          { time: "01:14", text: f("{{dream_description}} — it's not a fantasy. It's a memory your mind is building right now."), ssml_rate: "medium" },
          { time: "01:24", text: f("Feel it in your body. The {{dream_emotions}} — they're already yours."), ssml_rate: "medium" },
          { time: "01:34", text: "Look at who you've become. Look at what you've created.", ssml_rate: "medium" },
          { time: "01:42", text: "Your brain is wiring this future into your nervous system right now. The same neural pathways that fire when you physically experience this... are firing now.", ssml_rate: "medium" },
          { time: "01:52", text: "This is real. This is coming.", ssml_rate: "medium" },
        ],
      },
      {
        id: "mental_contrasting",
        name: "Mental Contrasting",
        start_time: "02:05",
        duration_seconds: 30,
        science_basis: "Oettingen WOOP / Mental Contrasting (2012); counters the 'positive fantasy trap'",
        narration_lines: [
          { time: "02:06", text: "But let's be honest.", ssml_rate: "medium" },
          { time: "02:09", text: "You know what stands between you and that life.", ssml_rate: "medium" },
          { time: "02:13", text: f("{{limiting_belief}} — that voice has been with you a long time."), ssml_rate: "medium" },
          { time: "02:19", text: f("And the real challenge: {{external_obstacle}}."), ssml_rate: "medium" },
          { time: "02:24", text: "This is not about ignoring what's hard. It's about seeing it clearly... and choosing to move through it anyway.", ssml_rate: "medium" },
          { time: "02:32", text: "The gap between where you are and where you're going? That's not a wall. It's a path.", ssml_rate: "medium" },
        ],
      },
      {
        id: "identity_action",
        name: "Identity & Action",
        start_time: "02:35",
        duration_seconds: 65,
        science_basis: "Identity-based habits (James Clear, 2018); Implementation intentions (Gollwitzer, 1999, d=.65); Self-affirmation neuroscience (Cascio et al., 2016)",
        narration_lines: [
          { time: "02:36", text: "So who do you need to become?", ssml_rate: "medium" },
          { time: "02:40", text: f("You are {{future_identity}}."), ssml_rate: "medium" },
          { time: "02:45", text: f("Say that again in your mind. {{future_identity}}."), ssml_rate: "medium" },
          { time: "02:50", text: "And here's what that person does —", ssml_rate: "medium" },
          { time: "02:53", text: f("Every day, {{first_name}} {{daily_habit}}."), ssml_rate: "medium" },
          { time: "02:58", text: "Not because it's easy. Because that's who you are now.", ssml_rate: "medium" },
          { time: "03:04", text: f("When it's {{if_time}}... you {{then_action}}. No debate. No negotiation."), ssml_rate: "medium" },
          { time: "03:12", text: "Every single rep is a vote for who you're becoming.", ssml_rate: "medium" },
          { time: "03:18", text: "Watch yourself build this. Day after day.", ssml_rate: "medium" },
          { time: "03:24", text: f("The person who achieves that dream? You're watching {{pronoun}} right now."), ssml_rate: "medium" },
          { time: "03:30", text: "It's the same person. The one who does the work IS the one who lives the dream.", ssml_rate: "medium" },
        ],
      },
      {
        id: "integration",
        name: "Integration & Return",
        start_time: "03:40",
        duration_seconds: 30,
        science_basis: "Silva Method exit protocol; Implementation intentions anchoring (Gollwitzer); Neuroplastic window (Doidge, 2007)",
        narration_lines: [
          { time: "03:40", text: "Carry this with you.", ssml_rate: "slow" },
          { time: "03:48", text: "Now... gently come back.", ssml_rate: "slow" },
          { time: "03:52", text: "Feel your body. Feel the ground beneath you.", ssml_rate: "slow" },
          { time: "03:56", text: "You know what to do.", ssml_rate: "slow" },
          { time: "03:58", text: f("Your first step: {{first_step}}."), ssml_rate: "slow" },
          { time: "04:02", text: "Not tomorrow. Today.", ssml_rate: "slow" },
          { time: "04:05", text: f("Open your eyes, {{first_name}}. You're ready."), ssml_rate: "slow" },
        ],
      },
    ],
  };
}

// Convert narration to SSML for Google Cloud TTS
export function toSSML(lines: { text: string; ssml_rate?: string }[]): string {
  const ssmlLines = lines.map((line) => {
    const rate = line.ssml_rate ?? "medium";
    return `<prosody rate="${rate}">${line.text}</prosody><break time="800ms"/>`;
  });

  return `<speak>${ssmlLines.join("\n")}</speak>`;
}
