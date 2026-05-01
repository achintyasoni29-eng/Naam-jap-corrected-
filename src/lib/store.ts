import { create } from "zustand";
import { persist } from "zustand/middleware";

// Milestones definition
export const MILESTONES = [
  { threshold: 108, name: "First Circle", description: "Your first mala is complete", icon: "filter_vintage" },
  { threshold: 1008, name: "Awakening", description: "The seed of devotion sprouts", icon: "spa" },
  { threshold: 5000, name: "Whispering Pines", description: "The forest listens to your chant", icon: "park" },
  { threshold: 10000, name: "Gate of Peace", description: "A threshold crossed in silence", icon: "filter_vintage" },
  { threshold: 25000, name: "Still Waters", description: "Reflection becomes your nature", icon: "waves" },
  { threshold: 50000, name: "Valley of Stillness", description: "The valley echoes your naam", icon: "wb_twilight" },
  { threshold: 100000, name: "Mountain of Devotion", description: "The summit reveals the cosmos", icon: "landscape" },
  { threshold: 250000, name: "Celestial River", description: "Your chants flow like the Ganges", icon: "water" },
  { threshold: 500000, name: "Golden Dawn", description: "The first light of true devotion", icon: "wb_sunny" },
  { threshold: 1000000, name: "Million Lotus", description: "A million petals of pure intention", icon: "local_florist" },
  { threshold: 2500000, name: "Eternal Garden", description: "Walking among divine blossoms", icon: "yard" },
  { threshold: 5000000, name: "Halfway to Infinity", description: "Five million names merge with the cosmos", icon: "stars" },
  { threshold: 7500000, name: "Crown of Stars", description: "The universe crowns your persistence", icon: "auto_awesome" },
  { threshold: 10000000, name: "One Crore - Celestial Completion", description: "The ultimate merger with the divine", icon: "brightness_7" },
] as const;

export const ISHTA_DEVATAS = [
  { name: "Sri Ram", hue: "saffron", emoji: "🙏" },
  { name: "Shiva", hue: "blue", emoji: "🔱" },
  { name: "Radha Krishna", hue: "pink", emoji: "🍀" },
  { name: "Hanuman", hue: "orange", emoji: "🐾" },
  { name: "Durga", hue: "red", emoji: "⚔️" },
  { name: "Ganesh", hue: "gold", emoji: "🕉️" },
  { name: "Lakshmi", hue: "amber", emoji: "✨" },
  { name: "Saraswati", hue: "violet", emoji: "🎶" },
] as const;

export type DevataHue = typeof ISHTA_DEVATAS[number]["hue"];

interface SessionState {
  todayCount: number;
  sessionStart: number | null;
  lastTapTime: number;
}

interface NaamJapState {
  // Hydration guard - prevents SSR/client mismatch
  _hasHydrated: boolean;

  // Counter
  totalCount: number;
  session: SessionState;

  // Settings
  ishtaDevata: string;
  devataHue: DevataHue;
  hapticMode: "every_108" | "every_tap" | "off";
  soundMode: "every_108" | "every_tap" | "off";
  currentTab: "sanctuary" | "pilgrimage" | "akhand-jyot";

  // Milestones & Onboarding
  unlockedMilestones: number[];
  hasSeenOnboarding: boolean;
  dailyGoal: number;

  // Profile
  userName: string;

  // Actions
  incrementCount: (amount?: number) => void;
  addScannedCount: (count: number) => void;
  setIshtaDevata: (name: string, hue: DevataHue) => void;
  setHapticMode: (mode: "every_108" | "every_tap" | "off") => void;
  setSoundMode: (mode: "every_108" | "every_tap" | "off") => void;
  setCurrentTab: (tab: "sanctuary" | "pilgrimage" | "akhand-jyot") => void;
  unlockMilestone: (threshold: number) => void;
  setUserName: (name: string) => void;
  setHasSeenOnboarding: (status: boolean) => void;
  setDailyGoal: (goal: number) => void;
  resetSession: () => void;
  getProgress: () => number; // 0-1
  getNextMilestone: () => typeof MILESTONES[number] | null;
  getUnlockedMilestones: () => typeof MILESTONES;
  getTodayCount: () => number;
  getTotalDisplay: () => string;
  setHasHydrated: () => void;
}

const GOAL = 10_000_000;

function startOfDay(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString("en-IN");
}

export const useNaamJapStore = create<NaamJapState>()(
  persist(
    (set, get) => ({
      _hasHydrated: false,
      totalCount: 0,
      session: {
        todayCount: 0,
        sessionStart: null,
        lastTapTime: 0,
      },
      ishtaDevata: "Sri Ram",
      devataHue: "saffron",
      hapticMode: "every_108",
      soundMode: "every_tap",
      currentTab: "sanctuary",
      unlockedMilestones: [],
      userName: "Devotee",
      
      // New Onboarding States
      hasSeenOnboarding: false,
      dailyGoal: 108,

      setHasHydrated: () => set({ _hasHydrated: true }),

      incrementCount: (amount = 1) => {
        const state = get();
        const now = Date.now();
        const todayStart = startOfDay();

        set({
          totalCount: state.totalCount + amount,
          session: {
            todayCount: now >= todayStart ? state.session.todayCount + amount : amount,
            sessionStart: state.session.sessionStart ?? now,
            lastTapTime: now,
          },
        });

        // Check milestone unlocks
        const newTotal = state.totalCount + amount;
        MILESTONES.forEach(m => {
          if (newTotal >= m.threshold && !state.unlockedMilestones.includes(m.threshold)) {
            get().unlockMilestone(m.threshold);
          }
        });

        // Haptic feedback
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          if (state.hapticMode === "every_tap") {
            navigator.vibrate(10);
          } else if (state.hapticMode === "every_108") {
            if ((state.totalCount + amount) % 108 === 0) {
              navigator.vibrate([20, 50, 20]);
            }
          }
        }
      },

      addScannedCount: (count: number) => {
        if (count > 0) {
          const state = get();
          set({
            totalCount: state.totalCount + count,
            session: {
              ...state.session,
              todayCount: state.session.todayCount + count,
              lastTapTime: Date.now(),
            },
          });
        }
      },

      setIshtaDevata: (name: string, hue: DevataHue) => {
        set({ ishtaDevata: name, devataHue: hue });
      },

      setHapticMode: (mode) => set({ hapticMode: mode }),

      setSoundMode: (mode) => set({ soundMode: mode }),

      setCurrentTab: (tab) => set({ currentTab: tab }),

      unlockMilestone: (threshold: number) => {
        const state = get();
        if (!state.unlockedMilestones.includes(threshold)) {
          set({ unlockedMilestones: [...state.unlockedMilestones, threshold] });
        }
      },

      setUserName: (name) => set({ userName: name }),
      
      setHasSeenOnboarding: (status) => set({ hasSeenOnboarding: status }),
      
      setDailyGoal: (goal) => set({ dailyGoal: goal }),

      resetSession: () => {
        set({
          session: {
            todayCount: 0,
            sessionStart: null,
            lastTapTime: 0,
          },
        });
      },

      getProgress: () => Math.min(1, get().totalCount / GOAL),

      getNextMilestone: () => {
        const state = get();
        return MILESTONES.find(m => state.totalCount < m.threshold) ?? null;
      },

      getUnlockedMilestones: () => {
        const state = get();
        return MILESTONES.filter(m => state.unlockedMilestones.includes(m.threshold));
      },

      getTodayCount: () => {
        const state = get();
        const todayStart = startOfDay();
        return state.session.lastTapTime >= todayStart ? state.session.todayCount : 0;
      },

      getTotalDisplay: () => formatNumber(get().totalCount),
    }),
    {
      name: "naam-jap-storage",
      version: 3,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated();
      },
    }
  )
);
