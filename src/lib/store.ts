import { create } from "zustand";
import { persist } from "zustand/middleware";

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
  _hasHydrated: boolean;
  totalCount: number;
  session: SessionState;
  ishtaDevata: string;
  devataHue: DevataHue;
  hapticMode: "every_108" | "every_tap" | "off";
  soundMode: "every_108" | "every_tap" | "off";
  currentTab: "sanctuary" | "pilgrimage" | "akhand-jyot";
  unlockedMilestones: number[];
  hasSeenOnboarding: boolean;
  dailyGoal: number;
  userName: string;

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
  getProgress: () => number;
  getNextMilestone: () => typeof MILESTONES[number] | null;
  getUnlockedMilestones: () => typeof MILESTONES;
  getTodayCount: () => number;
  getTotalDisplay: () => string;
  setHasHydrated: () => void;
  
  // THE TWO NEW FIXES
  syncFromCloud: (total: number, milestones: number[]) => void;
  clearUserData: () => void;
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
      session: { todayCount: 0, sessionStart: null, lastTapTime: 0 },
      ishtaDevata: "Sri Ram",
      devataHue: "saffron",
      hapticMode: "every_108",
      soundMode: "every_tap",
      currentTab: "sanctuary",
      unlockedMilestones: [],
      userName: "Devotee",
      hasSeenOnboarding: false,
      dailyGoal: 108,

      setHasHydrated: () => set({ _hasHydrated: true }),

      incrementCount: (amount = 1) => {
        const state = get();
        const now = Date.now();
        const todayStart = startOfDay();
        
        // THE FIX: Check if the last tap happened BEFORE today's midnight
        const isNewDay = state.session.lastTapTime < todayStart;

        set({
          totalCount: state.totalCount + amount,
          session: {
            // If it's a new day, start fresh with the new amount. Otherwise, add to today's count.
            todayCount: isNewDay ? amount : state.session.todayCount + amount,
            sessionStart: isNewDay ? now : (state.session.sessionStart ?? now),
            lastTapTime: now,
          },
        });
        
        const newTotal = state.totalCount + amount;
        MILESTONES.forEach(m => {
          if (newTotal >= m.threshold && !state.unlockedMilestones.includes(m.threshold)) {
            get().unlockMilestone(m.threshold);
          }
        });

        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          if (state.hapticMode === "every_tap") navigator.vibrate(10);
          else if (state.hapticMode === "every_108" && (state.totalCount + amount) % 108 === 0) navigator.vibrate([20, 50, 20]);
        }
      },

      addScannedCount: (count: number) => {
        if (count > 0) {
          const state = get();
          const now = Date.now();
          const todayStart = startOfDay();
          
          // THE FIX FOR SCANNER: Same check for scanned physical counts
          const isNewDay = state.session.lastTapTime < todayStart;

          set({
            totalCount: state.totalCount + count,
            session: { 
              ...state.session, 
              todayCount: isNewDay ? count : state.session.todayCount + count, 
              lastTapTime: now,
              sessionStart: isNewDay ? now : (state.session.sessionStart ?? now)
            },
          });
        }
      },

      setIshtaDevata: (name, hue) => set({ ishtaDevata: name, devataHue: hue }),
      setHapticMode: (mode) => set({ hapticMode: mode }),
      setSoundMode: (mode) => set({ soundMode: mode }),
      setCurrentTab: (tab) => set({ currentTab: tab }),
      unlockMilestone: (threshold) => {
        const state = get();
        if (!state.unlockedMilestones.includes(threshold)) set({ unlockedMilestones: [...state.unlockedMilestones, threshold] });
      },
      setUserName: (name) => set({ userName: name }),
      setHasSeenOnboarding: (status) => set({ hasSeenOnboarding: status }),
      setDailyGoal: (goal) => set({ dailyGoal: goal }),
      resetSession: () => set({ session: { todayCount: 0, sessionStart: null, lastTapTime: 0 } }),
      getProgress: () => Math.min(1, get().totalCount / GOAL),
      getNextMilestone: () => get().totalCount < GOAL ? MILESTONES.find(m => get().totalCount < m.threshold) ?? null : null,
      getUnlockedMilestones: () => MILESTONES.filter(m => get().unlockedMilestones.includes(m.threshold)),
      getTodayCount: () => get().session.lastTapTime >= startOfDay() ? get().session.todayCount : 0,
      getTotalDisplay: () => formatNumber(get().totalCount),

      // NEW FIX LOGIC
      syncFromCloud: (total, milestones) => set({ totalCount: total, unlockedMilestones: milestones }),
      clearUserData: () => set({
        totalCount: 0,
        unlockedMilestones: [],
        hasSeenOnboarding: false, // Forces the next user to see the welcome screen!
        userName: '',
        session: { todayCount: 0, sessionStart: null, lastTapTime: 0 }
      }),
    }),
    {
      name: "naam-jap-storage",
      version: 3,
      onRehydrateStorage: () => (state) => { state?.setHasHydrated(); },
    }
  )
);
