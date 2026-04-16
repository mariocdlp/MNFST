// Global state management with Zustand
// Manages survey form state, user session, and UI state

import { create } from "zustand";
import { type SurveyData, type User, type Video, type ActionPledge, type Streak, type Notification } from "@/types";

// Default empty survey
const emptySurvey: SurveyData = {
  first_name: "",
  current_identity: "",
  occupation: "",
  gender: "prefer_not_to_say",
  goal_categories: [],
  dream_description: "",
  dream_scene: "",
  dream_emotions: [],
  timeline: "1_year",
  gratitude_personal_1: "",
  gratitude_personal_2: "",
  gratitude_personal_3: "",
  gratitude_self: "",
  inner_obstacle: "self_doubt",
  inner_obstacle_other: "",
  external_obstacle: "",
  limiting_belief: "",
  future_identity: "",
  daily_habit: "",
  first_step: "",
  if_time: "",
  then_action: "",
  ideal_routine: "",
  visual_mood: "warm_cinematic",
  voice_pref: "female",
  music_energy: "uplifting_emotional",
};

interface SurveyStore {
  currentStep: number;
  surveyData: SurveyData;
  uploadedPhotos: File[];
  photoUrls: string[];
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateSurvey: (data: Partial<SurveyData>) => void;
  addPhoto: (file: File) => void;
  removePhoto: (index: number) => void;
  setPhotoUrls: (urls: string[]) => void;
  resetSurvey: () => void;
}

export const useSurveyStore = create<SurveyStore>((set) => ({
  currentStep: 1,
  surveyData: { ...emptySurvey },
  uploadedPhotos: [],
  photoUrls: [],
  setStep: (step) => set({ currentStep: step }),
  nextStep: () => set((state) => ({ currentStep: Math.min(state.currentStep + 1, 6) })),
  prevStep: () => set((state) => ({ currentStep: Math.max(state.currentStep - 1, 1) })),
  updateSurvey: (data) =>
    set((state) => ({ surveyData: { ...state.surveyData, ...data } })),
  addPhoto: (file) =>
    set((state) => ({ uploadedPhotos: [...state.uploadedPhotos, file] })),
  removePhoto: (index) =>
    set((state) => ({
      uploadedPhotos: state.uploadedPhotos.filter((_, i) => i !== index),
      photoUrls: state.photoUrls.filter((_, i) => i !== index),
    })),
  setPhotoUrls: (urls) => set({ photoUrls: urls }),
  resetSurvey: () => set({ currentStep: 1, surveyData: { ...emptySurvey }, uploadedPhotos: [], photoUrls: [] }),
}));

interface AppStore {
  user: User | null;
  latestVideo: Video | null;
  pledges: ActionPledge[];
  streak: Streak | null;
  notifications: Notification[];
  unreadCount: number;
  setUser: (user: User | null) => void;
  setLatestVideo: (video: Video | null) => void;
  setPledges: (pledges: ActionPledge[]) => void;
  setStreak: (streak: Streak | null) => void;
  setNotifications: (notifications: Notification[]) => void;
  markNotificationRead: (id: string) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  user: null,
  latestVideo: null,
  pledges: [],
  streak: null,
  notifications: [],
  unreadCount: 0,
  setUser: (user) => set({ user }),
  setLatestVideo: (video) => set({ latestVideo: video }),
  setPledges: (pledges) => set({ pledges }),
  setStreak: (streak) => set({ streak }),
  setNotifications: (notifications) =>
    set({ notifications, unreadCount: notifications.filter((n) => !n.is_read).length }),
  markNotificationRead: (id) =>
    set((state) => {
      const updated = state.notifications.map((n) =>
        n.id === id ? { ...n, is_read: true } : n
      );
      return { notifications: updated, unreadCount: updated.filter((n) => !n.is_read).length };
    }),
}));
