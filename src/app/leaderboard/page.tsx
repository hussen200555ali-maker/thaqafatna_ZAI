"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/lib/game-store";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatar: string;
  level: number;
  xp: number;
  totalStars: number;
  completedLevels: number;
  currentStreak: number;
  score: number;
  isCurrentUser: boolean;
}

export default function LeaderboardPage() {
  const router = useRouter();
  const { userId } = useGameStore();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [period, setPeriod] = useState<"weekly" | "monthly" | "all-time">("weekly");
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [totalPlayers, setTotalPlayers] = useState(0);

  useEffect(() => {
    setLoading(true);
    const url = userId
      ? `/api/leaderboard?period=${period}&userId=${userId}`
      : `/api/leaderboard?period=${period}`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        setEntries(data.leaderboard || []);
        setUserRank(data.userRank || null);
        setTotalPlayers(data.totalPlayers || 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [period, userId]);

  const periodLabels: Record<string, { label: string; icon: string }> = {
    weekly: { label: "أسبوعي", icon: "📅" },
    monthly: { label: "شهري", icon: "🗓️" },
    "all-time": { label: "كلي", icon: "♾️" },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
      <header className="bg-white/80 backdrop-blur-md border-b border-amber-100 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => router.push("/")} className="flex items-center gap-2 text-stone-600 hover:text-stone-900">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <span className="text-sm font-medium">الرئيسية</span>
          </button>
          <h1 className="text-2xl font-bold text-stone-800" style={{ fontFamily: "var(--font-tajawal)" }}>🏆 المتصدّرون</h1>
          <div className="w-20" />
        </div>
        <div className="max-w-3xl mx-auto px-4 pb-3 flex gap-2 justify-center">
          {(Object.keys(periodLabels) as string[]).map((p) => (
            <button key={p} onClick={() => setPeriod(p as any)} className={cn("px-4 py-1.5 rounded-full text-sm font-bold transition-all", period === p ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md" : "bg-white text-stone-500 hover:bg-amber-50 border border-amber-200")}>
              {periodLabels[p].icon} {periodLabels[p].label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} className="w-16 h-16 rounded-full border-4 border-amber-400 border-t-transparent" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-xl font-bold text-stone-700 mb-2">لا يوجد متصدّرون بعد</h2>
            <p className="text-stone-500 text-sm mb-6">كن أول من يتصدر القائمة!</p>
            <button onClick={() => router.push("/")} className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold shadow-lg">ابدأ اللعب 🎮</button>
          </div>
        ) : (
          <>
            {entries.length >= 3 && (
              <div className="grid grid-cols-3 gap-3 mb-8 items-end">
                <PodiumCard entry={entries[1]} place={2} />
                <PodiumCard entry={entries[0]} place={1} />
                <PodiumCard entry={entries[2]} place={3} />
              </div>
            )}
            <div className="space-y-2">
              {entries.slice(3).map((entry, idx) => (<LeaderboardRow key={entry.userId} entry={entry} index={idx} />))}
            </div>
            {userRank && userRank > entries.length && (
              <div className="mt-6 pt-4 border-t-2 border-dashed border-amber-300">
                <div className="text-center text-stone-500 text-xs mb-2">• • •</div>
                <LeaderboardRow entry={{ rank: userRank, userId: userId || "", name: "أنت", avatar: "🧑‍🎓", level: 0, xp: 0, totalStars: 0, completedLevels: 0, currentStreak: 0, score: 0, isCurrentUser: true }} index={0} />
              </div>
            )}
            <div className="text-center mt-6 text-stone-400 text-xs">{totalPlayers} لاعب نشط</div>
          </>
        )}
      </main>
    </div>
  );
}

function PodiumCard({ entry, place }: { entry: LeaderboardEntry; place: number }) {
  const config = {
    1: { gradient: "from-yellow-400 to-amber-500", border: "border-yellow-400", badge: "🥇", height: "pt-6", medalSize: "text-5xl", glow: "shadow-[0_0_30px_rgba(255,215,0,0.4)]" },
    2: { gradient: "from-stone-300 to-stone-400", border: "border-stone-300", badge: "🥈", height: "pt-4", medalSize: "text-4xl", glow: "shadow-[0_0_20px_rgba(192,192,192,0.3)]" },
    3: { gradient: "from-orange-400 to-amber-600", border: "border-orange-400", badge: "🥉", height: "pt-4", medalSize: "text-4xl", glow: "shadow-[0_0_20px_rgba(205,127,50,0.3)]" },
  };
  const c = config[place as 1 | 2 | 3];
  return (
    <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: place * 0.15, type: "spring" }} className={cn("flex flex-col items-center", c.height)}>
      <div className={cn("w-full rounded-2xl p-4 border-2 bg-gradient-to-b text-center", c.gradient, c.border, c.glow)}>
        <div className={cn("mb-1", c.medalSize)}>{c.badge}</div>
        <div className="text-3xl mb-1">{entry.avatar}</div>
        <h3 className="font-bold text-white truncate text-sm">{entry.name}</h3>
        <p className="text-white/80 text-xs">المستوى {entry.level}</p>
        <div className="mt-2 bg-white/20 rounded-lg px-2 py-1">
          <span className="text-white font-bold text-sm">{entry.score.toLocaleString()}</span>
          <span className="text-white/70 text-[10px] mr-1">نقطة</span>
        </div>
      </div>
    </motion.div>
  );
}

function LeaderboardRow({ entry, index }: { entry: LeaderboardEntry; index: number }) {
  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}>
      <Card className={cn("p-3 flex items-center gap-3 border-2 transition-all", entry.isCurrentUser ? "border-amber-400 bg-amber-50 shadow-md" : "border-stone-200 bg-white")}>
        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0", entry.rank <= 3 ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white" : "bg-stone-100 text-stone-600")}>{entry.rank}</div>
        <div className="text-2xl">{entry.avatar}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-stone-800 truncate">{entry.name}</h3>
            {entry.isCurrentUser && <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-white text-[10px] font-bold">أنت</span>}
          </div>
          <div className="flex items-center gap-3 text-[10px] text-stone-400">
            <span>⭐ {entry.totalStars}</span><span>🎮 {entry.completedLevels} مرحلة</span><span>🔥 {entry.currentStreak} يوم</span>
          </div>
        </div>
        <div className="text-left flex-shrink-0">
          <div className="font-bold text-sm text-stone-800">{entry.score.toLocaleString()}</div>
          <div className="text-[10px] text-stone-400">نقطة</div>
        </div>
      </Card>
    </motion.div>
  );
}
