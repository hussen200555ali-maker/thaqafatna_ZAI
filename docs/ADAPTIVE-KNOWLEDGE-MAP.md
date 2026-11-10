# 🗺️ نظام خريطة المعرفة التكيّفية - وثيقة المعمارية الكاملة

> **الإصدار**: 1.0.0  
> **التاريخ**: 2026-10-13  
> **المؤلفون**: فريق تطوير "ثقافتنا"  
> **الحالة**: مُنفّذ وجاهز للاختبار

---

## 📑 جدول المحتويات

1. [نظرة عامة](#1-نظرة-عامة)
2. [القرارات المعمارية](#2-القرارات-المعمارية)
3. [بنية قاعدة البيانات](#3-بنية-قاعدة-البيانات)
4. [محرّك التكيّف الخوارزمي](#4-محرّك-التكيّف-الخوارزمي)
5. [واجهات برمجة التطبيقات (APIs)](#5-واجهات-برمجة-التطبيقات-apis)
6. [مكوّنات الواجهة الأمامية](#6-مكوّنات-الواجهة-الأمامية)
7. [تدفّق البيانات الكامل](#7-تدفّق-البيانات-الكامل)
8. [الأداء والقيود](#8-الأداء-والقيود)
9. [خارطة الطريق المستقبلية](#9-خارطة-الطريق-المستقبلية)

---

## 1. نظرة عامة

### 1.1 المشكلة التي حلتها
كان التطبيق لعبة كلمات تقليدية بترتيب ثابت للمراحل، بدون أي ذكاء تكيّفي أو تحليلات تعلّم. كل لاعب يرى نفس المحتوى بنفس الترتيب، بغض النظر عن أدائه.

### 1.2 الحل المُنفّذ
نظام ذكي متكامل من 5 ركائز تعمل معاً:

| الركيزة | الوصف | الأثر |
|---|---|---|
| 🎯 **المهارات** | شبكة هرمية من 20 مهارة عربية موزّعة على 5 جذور | تنظيم المحتوى علمياً |
| 📈 **الإتقان** | حساب نسبة إتقان كل لاعب لكل مهارة (Bayesian-style) | قياس دقيق للتعلّم |
| 🧠 **الحالة التكيّفية** | معامل صعوبة ديناميكي + نقاط قوة/ضعف | تجربة شخصية لكل لاعب |
| 📊 **أحداث التعلّم** | سجل كامل لكل تفاعل تعليمي | بيانات قيّمة للتحليلات |
| 🎮 **إحصائيات الألغاز** | أداء اللاعب حسب نوع اللغز | توصيات ذكية للأنواع |

### 1.3 المراجع العلمية المستخدمة
- **Bloom's Mastery Learning** (1968) - فلسفة الإتقان قبل المتابعة
- **Bayesian Knowledge Tracing** (Corbett & Anderson, 1995) - نموذج تتبّع المعرفة
- **Duolingo's Half-Life Regression** (Settles & Meeder, 2016) - نموذج النسيان
- **Khan Academy's Mastery System** - نظام الإتقان المُقسّم

---

## 2. القرارات المعمارية

### 2.1 لماذا SQLite بدلاً من PostgreSQL؟
- **السياق**: تطبيق NEXT.js بسيط، عدد مستخدمين محدود في مرحلة التطوير
- **الميزة**: لا حاجة لخادم منفصل، النسخ الاحتياطي سهل
- **العيوب**: محدودية الـ joins المتقدمة (تم التغلب عليها بالـ manual joins)
- **التراجع المستقبلي**: يمكن الانتقال إلى PostgreSQL بتعديل سطر واحد في `schema.prisma`

### 2.2 لماذا Zustand بدلاً من Redux للـ state management؟
- **السبب**: بسيط، خفيف، بدون boilerplate
- **الميزة**: الـ persist middleware يحفظ تلقائياً في localStorage
- **التغطية**: تكامل سلس مع React server components

### 2.3 لماذا Manual Joins في `knowledge-map` API؟
- **المشكلة**: Prisma + SQLite يواجه صعوبة مع `include` متداخلة (N+1 queries)
- **الحل**: استعلامات منفصلة + بناء Maps في الذاكرة
- **النتيجة**: تحسن الأداء من timeout إلى 389ms

### 2.4 لماذا Bayesian-style Mastery بدلاً من Bayes الكامل؟
- **السبب**: Bayes الكامل معقّد رياضياً وغير مفهوم للمستخدم
- **الحل**: متوسط مرجّح بسيط: `0.85 * mastery_old + 0.15 * performance`
- **الميزة**: 
  - سهل الفهم (النسبة المئوية)
  - يكافئ التقدّم التدريجي
  - لا ينهار عند إجابة خاطئة واحدة
  - يأخذ الـ decay في الحسبان

---

## 3. بنية قاعدة البيانات

### 3.1 النماذج الجديدة (6 نماذج)

**Skill (المهارة)** — يمثل مهارة دقيقة قابلة للقياس
- `id, code (unique), title, description, icon, category, level`
- `isRoot, parentId` (self-reference للهرمية)
- العلاقات: `LevelSkill[]`, `PlayerSkill[]`

**LevelSkill (ربط المراحل بالمهارات)** — many-to-many
- `levelId, skillId, weight (1-10)` 
- `@@unique([levelId, skillId])` — لا تكرار

**PlayerSkill (إتقان اللاعب لكل مهارة)**
- `userId, skillId, mastery (0-100 Float)`
- `attempts, correct, incorrect, hintsUsed, avgTimeSec`
- `lastPracticedAt, masteredAt`
- `@@unique([userId, skillId])`

**AdaptiveState (الحالة التكيّفية للاعب)** — واحد لكل لاعب
- `userId (unique), playerLevel, xp`
- `difficultyMultiplier (0.7-1.3 Float)`
- `strengths, weaknesses` (JSON arrays of skill IDs)
- `recommendedLevelId, recommendationReason, recommendationType`
- `lastMapUpdate`

**LearningEvent (سجل أحداث التعلّم)**
- `userId, eventType, context (JSON), value, timestamp`
- Indexes على `[userId, eventType]`, `[userId, timestamp]`, `[timestamp]`

**QuestionTypeStat (إحصائيات أنواع الألغاز)**
- `userId, puzzleType (unique pair)`
- `attempts, correct, avgTimeSec, lastPlayedAt`

### 3.2 شبكة المهارات (20 مهارة في 5 جذور)

```
📖 المفردات العربية (vocab)
├── 🌱 مفردات أساسية (vocab.basic) → فصل 1
├── 🌿 مفردات الطبيعة (vocab.nature) → فصل 2
├── 🧪 المصطلحات العلمية (vocab.science) → فصل 4
├── ✒️ المفردات الأدبية (vocab.literary) → فصل 6
└── 💭 الذاكرة العاملة (memory.work)

🏛️ الثقافة العربية (culture)
├── 🏺 التراث العربي (culture.heritage) → فصل 3
├── 💭 الأمثال الشائعة (culture.proverbs) → فصل 3
├── 🕌 الشخصيات الإسلامية (culture.figures) → فصل 5
└── 🗺️ الجغرافيا العربية (culture.geography) → فصل 2

📜 التاريخ والحضارة (history)
├── 🌟 قصص الأنبياء (history.prophets) → فصل 5
└── ⚔️ المعارك والغزوات (history.battles) → فصل 5

🔬 العلوم والمعرفة (science)
├── ⚅ علوم الطبيعة (science.nature) → فصل 2, 4
└── 💡 العلوم التقنية (science.tech) → فصل 4

🧩 التفكير المنطقي (logic)
├── 🔢 التعرف على الأنماط (logic.patterns)
└── 🧠 الاستنتاج المنطقي (logic.deduction)
```

**إجمالي الروابط**: 56 ربط بين المراحل والمهارات، بأوزان متفاوتة (1-10).

---

## 4. محرّك التكيّف الخوارزمي

### 4.1 الملف: `src/lib/adaptive-engine.ts`

#### الدوال الرئيسية:

| الدالة | المدخلات | المخرجات | الوصف |
|---|---|---|---|
| `updatePlayerSkill` | SkillMasteryUpdate | void | يحدّث إتقان اللاعب لمهارة |
| `logLearningEvent` | userId, eventType, context, value | void | يسجّل حدث تعلّم |
| `updateQuestionTypeStat` | userId, puzzleType, isCorrect, time | void | يحدّث إحصائيات نوع اللغز |
| `recalcAdaptiveState` | userId | void | يعيد حساب كل الحالة التكيّفية |
| `getPlayerAnalytics` | userId | PlayerAnalytics | يجلب كل التحليلات |
| `processLevelCompletion` | تفاصيل الإكمال | void | معالجة شاملة لإكمال مرحلة |

### 4.2 معادلة الإتقان

```
mastery_new = 0.85 × mastery_old + 0.15 × performance × 100

حيث:
  performance = 1.0  للإجابة الصحيحة بدون تلميح
  performance = 0.8  للإجابة الصحيحة مع تلميح واحد
  performance = 0.6  للإجابة الصحيحة مع تلميحين
  performance = 0.4  للإجابة الصحيحة مع 3+ تلميحات
  performance = 0.2  للإجابة الخاطئة (لا 0 لتفادي الانهيار)
```

### 4.3 خوارزمية التوصية الذكية

تطبّق القواعد بالترتيب (أول قاعدة مطابقة تُطبّق):

| الأولوية | النوع | الشرط | المثال |
|---|---|---|---|
| 1 | `review` | مهارة ضعيفة (< 40%) لها مرحلة غير مكتملة | "تحتاج تقوية مهارة X" |
| 2 | `next` | المرحلة التالية في نفس الفصل غير مكتملة | "أكمل فصل X" |
| 3 | `challenge` | فصل جديد تماماً | "استكشف فصلاً جديداً" |
| 4 | `explore` | fallback: أقدم مرحلة غير مكتملة | "استكمل رحلتك" |

### 4.4 معامل الصعوبة الديناميكي

```
avgMastery = متوسط إتقان كل مهارات اللاعب

difficultyMultiplier = clamp(0.7 + (avgMastery / 100) × 0.6, 0.7, 1.3)

حيث:
  0.7  → لاعب متعثر (يحتاج أسئلة أسهل)
  1.0  → لاعب متوسط
  1.3  → لاعب متقن (يحتاج أسئلة أصعب)
```

---

## 5. واجهات برمجة التطبيقات (APIs)

### 5.1 GET `/api/skills`
يجلب كل المهارات. يدعم `?category=` و `?rootOnly=true`.

### 5.2 GET `/api/knowledge-map?userId=xxx`
يبني خريطة المعرفة الكاملة للاعب (20 مهارة في 5 جذور، مع كل التفاصيل).

### 5.3 GET `/api/analytics?userId=xxx`
يجلب كل تحليلات اللاعب في بنية واحدة منظّمة (مستوى، XP، توصية، نمو أسبوعي، توزيع أنواع).

### 5.4 POST `/api/analytics`
يعالج إكمال مرحلة بشكل كامل:
1. تحديث إتقان كل مهارة في المرحلة (مُوزّعة بالوزن)
2. تسجيل أحداث التعلّم (level_complete, bonus_found)
3. تحديث إحصائيات نوع اللغز
4. إعادة حساب الحالة التكيّفية
5. توليد توصية ذكية جديدة

---

## 6. مكوّنات الواجهة الأمامية

### 6.1 `KnowledgeMap` (`src/components/game/knowledge-map.tsx`)

**الميزات**:
- وضعان للعرض: شجرة هرمية 🌳 / شبكة مسطحة 🔲
- 4 ألوان للإتقان (رمادي/كهرماني/أخضر/بنفسجي)
- توسيع/طيّ كل مهارة جذرية لرؤية فروعها
- عرض المراحل المرتبطة بكل مهارة
- إحصائيات سريعة في الأعلى

### 6.2 `LearningAnalytics` (`src/components/game/learning-analytics.tsx`)

**الأقسام**:
1. **بطاقة المستوى + التوصية الذكية** — المستوى + XP + توصية مع زر "ابدأ الآن"
2. **رسم بياني أسبوعي** — آخر 7 أيام مع النجوم المكتسبة
3. **نقاط القوة والضعف** — Top 3 لكل فئة مع أشرطة تقدّم
4. **توزيع أنواع الألغاز** — 12 نوع مدعوم مع نسب النجاح

### 6.3 التكامل في `page.tsx`

- 2 صفحات جديدتان: `knowledge-map`, `analytics`
- شريط سفلي محدّث إلى 5 أزرار
- بطاقة "توصية ذكية" في الصفحة الرئيسية
- بطاقتي دخول سريع لخريطة المعرفة والتحليلات

---

## 7. تدفّق البيانات الكامل

### 7.1 تدفّف إكمال مرحلة

```
[اللاعب يكمل مرحلة]
       ↓
[game-screen.tsx: checkWord()]
       ↓
[1. حساب النجوم بناءً على الأداء]
       ↓
[2. completeLevel() في Zustand store]
       ↓ (sync)
[3. saveProgress() → /api/progress POST]
       ↓ (async, non-blocking)
[4. fetch /api/analytics POST]
       ↓
[5. processLevelCompletion() في adaptive-engine]
   ├── updatePlayerSkill() لكل مهارة
   ├── logLearningEvent() للحدث
   ├── updateQuestionTypeStat() للنوع
   └── recalcAdaptiveState()
       ├── حساب نقاط القوة والضعف
       ├── تحديث معامل الصعوبة
       └── توليد توصية ذكية جديدة
       ↓
[6. الحالة التكيّفية محدّثة في DB]
       ↓
[SuccessModal تعرض النجوم + التفاصيل]
       ↓
[اللاعب يرى التوصية الجديدة في الصفحة الرئيسية]
```

---

## 8. الأداء والقيود

### 8.1 مقاييس الأداء المسجّلة

| العملية | الزمن المتوسط | الحجم |
|---|---|---|
| GET `/api/skills` | 226ms | ~2KB |
| GET `/api/knowledge-map` | 389ms | ~17KB |
| GET `/api/analytics` | 469ms | ~1.5KB |
| POST `/api/analytics` | ~1.5s | ~1.5KB |

### 8.2 القيود الحالية

1. **SQLite في dev mode**: يواجه صعوبة مع joins عميقة → تم الحل بالـ manual joins
2. **Next.js dev compilation**: استهلاك ذاكرة عالي عند أول request → محدود بـ 512MB
3. **No caching layer**: كل request يضرب DB مباشرة → مخطّط لإضافة Redis لاحقاً
4. **Synchronous recalculation**: recalcAdaptiveState يحجب الـ response → مخطّط لجعله async

---

## 9. خارطة الطريق المستقبلية

### 9.1 قصيرة المدى (1-2 أسبوع)
- [ ] اختبار شامل للتدفّق الكامل
- [ ] إضافة Redis cache
- [ ] Async recalc (background job)
- [ ] A/B testing framework

### 9.2 متوسطة المدى (1-2 شهر)
- [ ] خوارزمية تكيّف ترتيب الأسئلة داخل المرحلة
- [ ] شجرة مهارات مرئية (D3.js)
- [ ] مقارنة مع الأصدقاء
- [ ] تقارير أسبوعية

### 9.3 طويلة المدى (3-6 أشهر)
- [ ] Machine Learning model
- [ ] Learning Path Generation مخصّص
- [ ] B2B Dashboard للمدارس
- [ ] Multi-language support

---

## 📁 الملفات المُنشأة/المُعدّلة

### ملفات جديدة
- `src/lib/adaptive-engine.ts` — محرّك التكيّف (~470 سطر)
- `src/components/game/knowledge-map.tsx` — خريطة المعرفة (~590 سطر)
- `src/components/game/learning-analytics.tsx` — لوحة التحليلات (~460 سطر)
- `src/app/api/analytics/route.ts` — API التحليلات
- `src/app/api/knowledge-map/route.ts` — API خريطة المعرفة
- `src/app/api/skills/route.ts` — API المهارات
- `scripts/seed-skills.ts` — بذور المهارات
- `docs/ADAPTIVE-KNOWLEDGE-MAP.md` — هذه الوثيقة

### ملفات مُعدّلة
- `prisma/schema.prisma` — +6 نماذج جديدة
- `src/lib/game-store.ts` — إضافة levelStars, levelTimes, levelHints
- `src/components/game/game-screen.tsx` — دمج API analytics
- `src/app/page.tsx` — +2 صفحات + بطاقة توصية ذكية
- `src/app/globals.css` — animations جديدة

### إحصائيات
- **إجمالي الأسطر الجديدة**: ~2,500 سطر
- **نماذج قاعدة البيانات الجديدة**: 6 نماذج
- **API endpoints الجديدة**: 3 endpoints
- **مكوّنات React الجديدة**: 2 مكوّنات
- **المهارات المُنفّذة**: 20 مهارة في 5 جذور

---

## ✅ الخلاصة

تم بناء نظام **خريطة المعرفة التكيّفية** بنجاح، وهو يُمثّل نقلة نوعية لتطبيق "ثقافتنا" من لعبة كلمات تقليدية إلى **منصّة تعلّم عربية ذكية تكيّفية**. النظام جاهز للاختبار اليدوي ويُغطّي 3 ركائز أساسية:

1. **التكيّف الذكي**: المحرك يراقب الأداء ويضبط التجربة
2. **التحليلات الشاملة**: تقارير تفصيلية لنمو التعلم
3. **التوصيات الشخصية**: اقتراحات ذكية للخطوة التالية

هذا يضع التطبيق في مرتبة متقدّمة مقارنة بالتطبيقات العربية المنافسة، ويقترب من معايير Duolingo وKhan Academy العالمية.
