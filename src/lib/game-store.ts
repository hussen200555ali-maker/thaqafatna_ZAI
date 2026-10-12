import { create } from "zustand";
import { persist } from "zustand/middleware";
import { saveProgress, getOrCreateUser } from "./game-data-api";

export interface GameProgress {
  completedLevels: number[];
  currentLevel: number | null;
  coins: number;
  hintsUsed: number;
  lastDailyChallenge: string | null;
  dailyStreak: number;
  unlockedLevels: number[];
  totalStars: number;
  userId: string | null; // معرف المستخدم السحابي
  isSyncing: boolean;
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
  initCloudSync: () => Promise<void>;
  syncProgressToCloud: (levelId: number, isCompleted: boolean, score: number, timeSpent: number) => Promise<void>;
}

const initialState: GameProgress = {
  completedLevels: [],
  currentLevel: null,
  coins: 100,
  hintsUsed: 0,
  lastDailyChallenge: null,
  dailyStreak: 0,
  unlockedLevels: Array.from({ length: 50 }, (_, i) => i + 1),
  totalStars: 0,
  userId: null,
  isSyncing: false,
};

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      ...initialState,

      initCloudSync: async () => {
        const state = get();
        if (state.userId) return; // تم التهيئة بالفعل
        set({ isSyncing: true });
        try {
          const user = await getOrCreateUser();
          if (user) {
            set({ userId: user.id, coins: user.coins || state.coins, isSyncing: false });
          } else {
            set({ isSyncing: false });
          }
        } catch (error) {
          console.error("Error initializing cloud sync:", error);
          set({ isSyncing: false });
        }
      },

      syncProgressToCloud: async (levelId, isCompleted, score, timeSpent) => {
        const state = get();
        if (!state.userId) return;
        try {
          await saveProgress({
            userId: state.userId,
            levelId,
            isCompleted,
            stars: isCompleted ? 1 : 0,
            score,
            hintsUsed: state.hintsUsed,
            timeSpent,
            coinsEarned: 0, // العملات تُضاف محلياً
          });
        } catch (error) {
          console.error("Error syncing progress:", error);
        }
      },

      completeLevel: (levelId, reward) =>
        set((state) => {
          if (state.completedLevels.includes(levelId)) return state;
          const newState = {
            completedLevels: [...state.completedLevels, levelId],
            coins: state.coins + reward,
            totalStars: state.totalStars + 1,
            unlockedLevels: state.unlockedLevels.includes(levelId + 1)
              ? state.unlockedLevels
              : [...state.unlockedLevels, levelId + 1],
          };
          // مزامنة سحابية (غير منعشة)
          if (state.userId) {
            saveProgress({
              userId: state.userId,
              levelId,
              isCompleted: true,
              stars: 1,
              score: reward,
              hintsUsed: state.hintsUsed,
              timeSpent: 0,
              coinsEarned: reward,
            }).catch((e) => console.error("Cloud sync error:", e));
          }
          return newState;
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
