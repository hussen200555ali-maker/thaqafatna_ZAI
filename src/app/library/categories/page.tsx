"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
  booksCount: number;
}

const categoryStyles: Record<string, { icon: string; gradient: string; description: string }> = {
  "الأدب العربي": { icon: "📖", gradient: "from-blue-600 to-indigo-700", description: "روايات وقصص الأدب العربي" },
  "الكتب الدينية": { icon: "🕌", gradient: "from-emerald-600 to-teal-700", description: "كتب الدين الإسلامي" },
  "التاريخ والتراث": { icon: "📜", gradient: "from-amber-600 to-orange-700", description: "تاريخ الأمة وتراثها" },
  "العلوم والمعرفة": { icon: "🔬", gradient: "from-purple-600 to-fuchsia-700", description: "علوم ومعارف متنوعة" },
  "الجغرافيا والرحلات": { icon: "🌍", gradient: "from-cyan-600 to-blue-700", description: "رحلات وجغرافيا" },
  "الفنون والآداب": { icon: "🎨", gradient: "from-pink-600 to-rose-700", description: "فنون وآداب" },
  "أدب الأطفال": { icon: "🧸", gradient: "from-orange-500 to-amber-600", description: "كتب الأطفال" },
  "التطوير المهني": { icon: "💼", gradient: "from-stone-600 to-slate-700", description: "تطوير المهارات المهنية" },
  "التنمية البشرية": { icon: "🌱", gradient: "from-green-600 to-emerald-700", description: "تطوير الذات" },
  "الفلسفة والمنطق": { icon: "🧠", gradient: "from-violet-600 to-purple-700", description: "فلسفة ومنطق" },
  "علم النفس": { icon: "💭", gradient: "from-rose-600 to-pink-700", description: "علم النفس والسلوك" },
  "الشعر والشعراء": { icon: "✒️", gradient: "from-indigo-600 to-violet-700", description: "ديوان الشعر العربي" },
  "السير والتراجم": { icon: "👥", gradient: "from-teal-600 to-cyan-700", description: "سير وتراجم الأعلام" },
  "الروايات والقصص": { icon: "📚", gradient: "from-red-600 to-rose-700", description: "روايات وقصص" },
};

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch("/api/book-categories")
      .then((r) => r.json())
      .then((data) => setCategories(data.categories || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const getStyle = (name: string) => {
    return (
      categoryStyles[name] || {
        icon: "📕",
        gradient: "from-slate-600 to-stone-700",
        description: "تصنيف متنوع",
      }
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 text-stone-100">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-stone-800 rounded-xl w-64 mx-auto" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-square bg-stone-800 rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 text-stone-100">
      {/* خلفية متوهّجة */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 bg-stone-950/50 backdrop-blur-xl border-b border-stone-800/50 sticky top-0">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.push("/library")}
            className="flex items-center gap-2 text-stone-300 hover:text-white"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <span className="text-sm">المكتبة</span>
          </button>
          <div className="text-sm text-stone-300">📂 {categories.length} تصنيف</div>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* العنوان */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <span className="text-4xl">📂</span>
            <span>تصفّح التصنيفات</span>
          </h1>
          <p className="text-stone-400 text-sm">
            اختر تصنيفك المفضل واكتشف كتباً جديدة
          </p>
        </motion.div>

        {/* شريط البحث */}
        <div className="max-w-md mx-auto">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 ابحث عن تصنيف..."
            className="w-full px-4 py-2.5 rounded-xl bg-stone-900/80 border border-stone-700 text-white placeholder-stone-500 focus:border-purple-500 outline-none transition-colors text-center"
          />
        </div>

        {/* شبكة التصنيفات */}
        {filteredCategories.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredCategories.map((cat, idx) => {
              const style = getStyle(cat.name);
              return (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: Math.min(idx * 0.03, 0.5) }}
                >
                  <Link
                    href={`/library?category=${cat.id}`}
                    className={cn(
                      "relative block aspect-square p-5 rounded-2xl bg-gradient-to-br text-white overflow-hidden group hover:scale-105 transition-transform shadow-lg flex flex-col items-center justify-center text-center",
                      style.gradient
                    )}
                  >
                    <div className="absolute -top-4 -left-4 text-7xl opacity-20 group-hover:opacity-30 group-hover:scale-110 transition-all">
                      {style.icon}
                    </div>
                    <div className="relative">
                      <div className="text-5xl mb-3">{style.icon}</div>
                      <h3 className="font-bold text-sm mb-1 line-clamp-2">
                        {cat.name}
                      </h3>
                      <p className="text-xs opacity-80 mb-2 line-clamp-1">
                        {style.description}
                      </p>
                      <div className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full inline-block">
                        {cat.booksCount || 0} كتاب
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-stone-300 mb-2">لا يوجد تصنيف مطابق</h3>
            <button
              onClick={() => setSearchQuery("")}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white font-medium"
            >
              عرض كل التصنيفات
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
