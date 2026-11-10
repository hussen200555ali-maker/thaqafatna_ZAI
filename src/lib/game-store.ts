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
  /** نجوم كل مرحلة على حدة (مفتاح = رقم المرحلة، قيمة = عدد النجوم 1..3) */
  levelStars: Record<number, number>;
  /** وقت إكمال كل مرحلة بالثواني */
  levelTimes: Record<number, number>;
  /** عدد التلميحات المستخدمة في كل مرحلة */
  levelHints: Record<number, number>;
}

interface GameState extends GameProgress {
  // Actions
  completeLevel: (levelId: number, reward: number, stars: number, timeSpent: number, hintsUsed: number) => void;
  unlockLevel: (levelId: number) => void;
  setCurrentLevel: (levelId: number | null) => void;
  addCoins: (amount: number) => boolean;
  spendCoins: (amount: number) => boolean;
  useHint: () => void;
  resetLevelStats: () => void; // إعادة تعيين إحصائيات المرحلة الحالية
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
  levelStars: {},
  levelTimes: {},
  levelHints: {},
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
            stars: state.levelStars[levelId] || 0,
            score,
            hintsUsed: state.levelHints[levelId] || 0,
            timeSpent,
            coinsEarned: 0, // العملات تُضاف محلياً
          });
        } catch (error) {
          console.error("Error syncing progress:", error);
        }
      },

      completeLevel: (levelId, reward, stars, timeSpent, hintsUsed) =>
        set((state) => {
          // الاحتفاظ بأعلى نتيجة إذا أعاد اللاعب المرحلة
          const previousStars = state.levelStars[levelId] || 0;
          const bestStars = Math.max(previousStars, stars);
          const isFirstCompletion = !state.completedLevels.includes(levelId);
          const previousTime = state.levelTimes[levelId] || Infinity;
          const bestTime = Math.min(previousTime, timeSpent);
          const previousHints = state.levelHints[levelId] ?? Infinity;
          const bestHints = Math.min(previousHints, hintsUsed);

          // النجوم المكتسبة حديثاً (فقط الزيادة)
          const gainedStars = bestStars - previousStars;

          // المكافأة الكاملة تُضاف فقط عند أول إكمال
          const coinsToAdd = isFirstCompletion ? reward : Math.floor(reward * 0.2 * gainedStars);

          const newLevelStars = { ...state.levelStars, [levelId]: bestStars };
          const newTotalStars = Object.values(newLevelStars).reduce((sum, s) => sum + s, 0);

          const newState: Partial<GameProgress> = {
            levelStars: newLevelStars,
            levelTimes: { ...state.levelTimes, [levelId]: bestTime },
            levelHints: { ...state.levelHints, [levelId]: bestHints },
            totalStars: newTotalStars,
          };

          if (isFirstCompletion) {
            newState.completedLevels = [...state.completedLevels, levelId];
            newState.coins = state.coins + coinsToAdd;
          } else if (gainedStars > 0) {
            newState.coins = state.coins + coinsToAdd;
          }

          // مزامنة سحابية (غير منعشة)
          if (state.userId) {
            saveProgress({
              userId: state.userId,
              levelId,
              isCompleted: true,
              stars: bestStars,
              score: reward + gainedStars * 30,
              hintsUsed: bestHints,
              timeSpent: bestTime,
              coinsEarned: coinsToAdd,
            }).catch((e) => console.error("Cloud sync error:", e));
          }

          return newState as GameState;
        }),

      unlockLevel: (levelId) =>
        set((state) =>
          state.unlockedLevels.includes(levelId)
            ? state
            : { unlockedLevels: [...state.unlockedLevels, levelId] }
        ),

      setCurrentLevel: (levelId) => set({ currentLevel: levelId }),

      addCoins: (amount) => {
        set({ coins: get().coins + amount });
        return true;
      },

      spendCoins: (amount) => {
        const current = get().coins;
        if (current < amount) return false;
        set({ coins: current - amount });
        return true;
      },

      useHint: () => set((state) => ({ hintsUsed: state.hintsUsed + 1 })),

      resetLevelStats: () => set({ hintsUsed: 0 }),

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
        return state.levelStars[levelId] || (state.completedLevels.includes(levelId) ? 1 : 0);
      },
    }),
    {
      name: "thaqafatuna-progress",
    }
  )
);
