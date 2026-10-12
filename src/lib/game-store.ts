import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface GameProgress {
  completedLevels: number[];
  currentLevel: number | null;
  coins: number;
  hintsUsed: number;
  lastDailyChallenge: string | null; // ISO date
  dailyStreak: number;
  unlockedLevels: number[];
  totalStars: number;
}

interface GameState extends GameProgress {
  // Actions
  completeLevel: (levelId: number, reward: number) => void;
  unlockLevel: (levelId: number) => void;
  setCurrentLevel: (levelId: number | null) => void;
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  useHint: () => void;
  completeDailyChallenge: (date: string, reward: number) => void;
  resetProgress: () => void;
  getLevelStars: (levelId: number) => number;
}

const initialState: GameProgress = {
  completedLevels: [],
  currentLevel: null,
  coins: 100, // عملات ترحيبية
  hintsUsed: 0,
  lastDailyChallenge: null,
  dailyStreak: 0,
  unlockedLevels: [1, 2, 3, 4, 5, 6], // المراحل الأولى مفتوحة
  totalStars: 0,
};

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      ...initialState,

      completeLevel: (levelId, reward) =>
        set((state) => {
          if (state.completedLevels.includes(levelId)) return state;
          return {
            completedLevels: [...state.completedLevels, levelId],
            coins: state.coins + reward,
            totalStars: state.totalStars + 1,
            // فتح المرحلة التالية
            unlockedLevels: state.unlockedLevels.includes(levelId + 1)
              ? state.unlockedLevels
              : [...state.unlockedLevels, levelId + 1],
          };
        }),

      unlockLevel: (levelId) =>
        set((state) =>
          state.unlockedLevels.includes(levelId)
            ? state
            : { unlockedLevels: [...state.unlockedLevels, levelId] }
        ),

      setCurrentLevel: (levelId) => set({ currentLevel: levelId }),

      addCoins: (amount) => set((state) => ({ coins: state.coins + amount })),

      spendCoins: (amount) => {
        const current = get().coins;
        if (current < amount) return false;
        set({ coins: current - amount });
        return true;
      },

      useHint: () => set((state) => ({ hintsUsed: state.hintsUsed + 1 })),

      completeDailyChallenge: (date, reward) =>
        set((state) => {
          const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
          const newStreak = state.lastDailyChallenge === yesterday ? state.dailyStreak + 1 : 1;
          return {
            lastDailyChallenge: date,
            dailyStreak: newStreak,
            coins: state.coins + reward + (newStreak > 1 ? newStreak * 5 : 0),
          };
        }),

      resetProgress: () => set(initialState),

      getLevelStars: (levelId) => {
        const state = get();
        return state.completedLevels.includes(levelId) ? 1 : 0;
      },
    }),
    {
      name: "thaqafatna-progress",
    }
  )
);
