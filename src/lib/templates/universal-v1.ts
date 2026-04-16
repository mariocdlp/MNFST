// Universal Manifestation Protocol — Template v1
// 1 universal template, 3 vibe variations
// New templates/vibes can be added by creating new files — no code changes needed

export interface VibeSection {
  scene_prompts?: string[];
  scene_prompt_template?: string;
  secondary_scene_template?: string;
  routine_prompt_template?: string;
  duration_seconds: number;
}

export interface Vibe {
  vibe_id: string;
  name: string;
  description: string;
  color_grading: string;
  music_bed: string;
  binaural_beat_track: string;
  narration_style: string;
  transition_style: string;
  color_filter: {
    brightness: number;
    contrast: number;
    saturation: number;
    hue_rotate: number;
    warmth: string;
  };
  sections: {
    induction: VibeSection;
    gratitude: VibeSection;
    dream_realized: VibeSection;
    mental_contrasting: VibeSection;
    identity_action: VibeSection;
    integration: VibeSection;
  };
}

export interface Template {
  template_id: string;
  name: string;
  version: string;
  total_duration_seconds: number;
  vibes: Vibe[];
}

const universalV1: Template = {
  template_id: "universal_v1",
  name: "Universal Manifestation Protocol",
  version: "1.0.0",
  total_duration_seconds: 250, // ~4:10
  vibes: [
    {
      vibe_id: "warm_cinematic",
      name: "Warm & Cinematic",
      description: "Golden tones, soft light, emotional strings + piano. Aspirational and tender.",
      color_grading: "golden, warm highlights, soft shadows, amber tint",
      music_bed: "warm_cinematic_uplifting.mp3",
      binaural_beat_track: "alpha_10hz_ambient.mp3",
      narration_style: "warm, intimate, unhurried",
      transition_style: "slow dissolve, light leak",
      color_filter: {
        brightness: 1.05,
        contrast: 1.1,
        saturation: 1.15,
        hue_rotate: -5,
        warmth: "sepia(0.1) brightness(1.05)",
      },
      sections: {
        induction: {
          scene_prompts: [
            "Golden morning light filtering through forest trees, mist on lake, cinematic, warm tones, 4K",
            "Abstract golden light refracting through water surface, meditative, warm color palette",
            "Sunlit meadow at dawn, dew on grass, ethereal warm golden atmosphere, slow camera dolly",
          ],
          duration_seconds: 35,
        },
        gratitude: {
          scene_prompts: [
            "Warm sunrise through kitchen window, cozy home environment, golden light, cinematic",
            "Two people embracing warmly, backlit by golden sun, emotional, intimate",
            "Close-up of hands holding coffee mug, morning sunlight, warmth and comfort, cinematic bokeh",
          ],
          duration_seconds: 30,
        },
        dream_realized: {
          scene_prompt_template:
            "{{user_likeness}} in {{dream_scene}}, cinematic golden hour lighting, warm color grading, photorealistic, 4K, emotional, {{dream_emotions}} mood",
          secondary_scene_template:
            "{{user_likeness}} {{dream_description}}, warm cinematic tone, aspirational, photorealistic",
          duration_seconds: 60,
        },
        mental_contrasting: {
          scene_prompts: [
            "Person sitting alone in dimly lit room at night, laptop open, contemplative, honest, desaturated warm tones",
            "Same person looking up with resolve, subtle shift in lighting toward warmth, determination in eyes",
          ],
          duration_seconds: 30,
        },
        identity_action: {
          scene_prompt_template:
            "{{user_likeness}} {{daily_habit}}, morning routine, determined, cinematic warm tones, montage style",
          routine_prompt_template:
            "{{user_likeness}} {{ideal_routine}}, warm lighting, focused energy, time-lapse progression",
          duration_seconds: 55,
        },
        integration: {
          scene_prompts: [
            "Morning light in clean room, person opening eyes slowly, calm and ready, warm golden tones",
            "Person walking forward through doorway into bright light, symbolic new beginning, cinematic",
          ],
          duration_seconds: 25,
        },
      },
    },
    {
      vibe_id: "clean_modern",
      name: "Clean & Modern",
      description: "Cool tones, crisp edges, electronic/ambient. Professional and focused.",
      color_grading: "cool blue-white, high contrast, clean whites, minimal shadows",
      music_bed: "clean_modern_ambient.mp3",
      binaural_beat_track: "alpha_10hz_ambient.mp3",
      narration_style: "clear, confident, measured",
      transition_style: "clean cut, subtle zoom",
      color_filter: {
        brightness: 1.08,
        contrast: 1.15,
        saturation: 0.9,
        hue_rotate: 5,
        warmth: "brightness(1.08) contrast(1.15)",
      },
      sections: {
        induction: {
          scene_prompts: [
            "Minimalist ocean horizon at dawn, clean blue-white tones, geometric cloud formations, 4K",
            "Abstract white light particles floating in space, clean modern aesthetic, meditative",
            "Still lake reflecting perfect sky, ultra-clean composition, blue-silver palette",
          ],
          duration_seconds: 35,
        },
        gratitude: {
          scene_prompts: [
            "Modern bright apartment with floor-to-ceiling windows, morning light, clean aesthetic",
            "Person looking out at city skyline through glass, peaceful, professional, clean tones",
            "Minimalist workspace with natural light, single plant, sense of calm order",
          ],
          duration_seconds: 30,
        },
        dream_realized: {
          scene_prompt_template:
            "{{user_likeness}} in {{dream_scene}}, clean modern aesthetic, high contrast, professional lighting, photorealistic, 4K, {{dream_emotions}} mood",
          secondary_scene_template:
            "{{user_likeness}} {{dream_description}}, clean modern tone, professional, photorealistic",
          duration_seconds: 60,
        },
        mental_contrasting: {
          scene_prompts: [
            "Person at desk in dim blue light, screen glow, contemplative, clean modern tones, honest moment",
            "Same person straightening up, light increasing, determination, sharp focus",
          ],
          duration_seconds: 30,
        },
        identity_action: {
          scene_prompt_template:
            "{{user_likeness}} {{daily_habit}}, modern environment, determined, clean aesthetic, montage style",
          routine_prompt_template:
            "{{user_likeness}} {{ideal_routine}}, modern clean setting, focused energy, time-lapse progression",
          duration_seconds: 55,
        },
        integration: {
          scene_prompts: [
            "Bright modern room, morning light through blinds, person opening eyes, clean and ready",
            "Person walking through modern glass doorway into bright space, forward momentum, clean aesthetic",
          ],
          duration_seconds: 25,
        },
      },
    },
    {
      vibe_id: "dark_dramatic",
      name: "Dark & Dramatic",
      description: "Deep contrast, moody lighting, powerful orchestral/bass. Intense and driven.",
      color_grading: "deep shadows, high contrast, dramatic rim lighting, teal-orange",
      music_bed: "dark_dramatic_powerful.mp3",
      binaural_beat_track: "alpha_10hz_ambient.mp3",
      narration_style: "powerful, resonant, deliberate",
      transition_style: "fade through black, dramatic reveal",
      color_filter: {
        brightness: 0.95,
        contrast: 1.3,
        saturation: 1.1,
        hue_rotate: 0,
        warmth: "contrast(1.3) brightness(0.95)",
      },
      sections: {
        induction: {
          scene_prompts: [
            "Dark mountain peaks at twilight, dramatic clouds, deep shadows with rim lighting, 4K cinematic",
            "Abstract dark void with single point of light expanding, dramatic, intense",
            "Storm clearing over dark ocean, first rays of light breaking through, powerful atmosphere",
          ],
          duration_seconds: 35,
        },
        gratitude: {
          scene_prompts: [
            "Candlelit room, dramatic shadows, intimate warmth within darkness, chiaroscuro",
            "Silhouette of person by window, city lights bokeh, reflective, dramatic contrast",
            "Fireplace glow in dark room, deep warmth emerging from shadow, intimate",
          ],
          duration_seconds: 30,
        },
        dream_realized: {
          scene_prompt_template:
            "{{user_likeness}} in {{dream_scene}}, dramatic lighting, deep contrast, cinematic teal-orange grading, photorealistic, 4K, powerful {{dream_emotions}} mood",
          secondary_scene_template:
            "{{user_likeness}} {{dream_description}}, dark dramatic tone, powerful, photorealistic",
          duration_seconds: 60,
        },
        mental_contrasting: {
          scene_prompts: [
            "Person in complete darkness, single harsh light overhead, raw and honest, dramatic shadows",
            "Person clenching fist, light building from below, fierce resolve, dramatic transformation",
          ],
          duration_seconds: 30,
        },
        identity_action: {
          scene_prompt_template:
            "{{user_likeness}} {{daily_habit}}, dramatic lighting, intense focus, powerful montage style",
          routine_prompt_template:
            "{{user_likeness}} {{ideal_routine}}, dramatic atmosphere, relentless energy, time-lapse progression",
          duration_seconds: 55,
        },
        integration: {
          scene_prompts: [
            "Dawn breaking over dark landscape, person standing tall on hill, dramatic silhouette",
            "Person striding forward through dramatic light, power walk, fade to dramatic logo reveal",
          ],
          duration_seconds: 25,
        },
      },
    },
  ],
};

export default universalV1;
