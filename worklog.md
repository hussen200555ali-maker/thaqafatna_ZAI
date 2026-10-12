---
Task ID: positive-stars-system
Agent: Main (Super Z)
Task: تصميم وتنفيذ نظام النجوم الإيجابي الاحترافي لتطبيق ثقافتنا

Work Log:
- قرأت بنية المشروع الحالية (game-store, game-screen, page, profile, sound-effects, prisma schema, progress API)
- حللت نظام النجوم القديم (عقابي): `hintsUsed === 0 && timeSpent < 120 ? 3 : hintsUsed <= 3 && timeSpent < 300 ? 2 : 1`
- صممت النظام الإيجابي الجديد المبني على 3 مبادئ:
  * نجمة الإنجاز - مضمونة للإكمال (لا تُسحب)
  * نجمة الذكاء - تتوهج عند عدم استخدام تلميحات (أو استخدام قليل حسب طول المرحلة)
  * نجمة السرعة - تتوهج عند الإنجاز السريع ضمن عتبة الصعوبة
- حدّثت `src/lib/game-store.ts`:
  * أضفت `levelStars`, `levelTimes`, `levelHints` كـ Records للبيانات لكل مرحلة
  * غيّرت توقيع `completeLevel` لقبول (levelId, reward, stars, timeSpent, hintsUsed)
  * أضفت منطق "أعلى نتيجة" - إذا أعاد اللاعب المرحلة، تُحفظ أعلى نتيجة فقط
  * `totalStars` الآن يُحسب ديناميكياً من `levelStars` (وليس +1 لكل إكمال)
- أنشأت `src/components/game/star-reward.tsx`:
  * مكوّن `StarReward` مع حركات كشف تدريجية (التوهج، الجسيمات المتطايرة، تدرج الألوان)
  * دالة `computeStars` التي تحسب النجوم بناءً على timeSpent, hintsUsed, difficulty, wordCount
  * عتبات السرعة مرنة: 25ث/كلمة سهل، 35ث/كلمة متوسط، 50ث/كلمة صعب
  * عرض "سبب" كل نجمة (مكتسبة أو مع تلميح لكيفية كسبها)
- أضفت 3 مؤثرات صوتية جديدة في `src/lib/sound-effects.ts`:
  * `starReveal(starNumber)` - نغمة متصاعدة حسب ترتيب النجمة (C, D, E لكل نجمة)
  * `starShine` - توهج كامل مع نغمات عالية متتابعة
  * `starMiss` - نغمة لطيفة عند نجمة مفقودة (لا تزعج)
- أضفت CSS animations في `globals.css`: `pulse-soft`, `star-glow-in`
- أعدت تصميم `SuccessModal` في `game-screen.tsx`:
  * عرض `StarReward` مع تأخيرات تدريجية (850ms بين كل نجمة)
  * عداد نجوم المرحلة "stars/3"
  * بطاقة "كيف تكسب نجوم أكثر؟" تظهر فقط إذا لم يحصل على 3
  * رموز متطايرة تتناسب مع عدد النجوم (12 + stars*3)
  * عنوان فرعي ديناميكي حسب الأداء
- حدّثت `src/app/page.tsx`:
  * مرّرت `getLevelStars` و `totalStars` من store إلى HomeView
  * أضفت شارة النجوم الكلية ⭐ بجانب العملات في البطاقة الترحيبية
  * في شبكة المراحل: النجوم المكتسبة تتوهج (drop-shadow)، غير المكتسبة باهتة
- حدّثت `src/components/home/profile.tsx`:
  * أضفت "لوحة النجوم التفصيلية" مع:
    - شريط نسبة الإتقان (totalStars / maxPossible)
    - توزيع النجوم: 3-نجوم / 2-نجوم / 1-نجمة
  * أضفت إحصائية "مراحل 3 نجوم"
  * أضفت إنجازين جديدين: "بطل النجوم" (5 مراحل 3 نجوم) و "أسطورة" (50 نجمة)

Stage Summary:
- نظام النجوم الجديد إيجابي بالكامل: النجمة الأولى مضمونة، والنجوم الإضافية تتوهج تدريجياً كمكافأة (لا عقاب)
- يحفظ أعلى نتيجة فقط عند إعادة المحاولة (لا تخسر تقدماً)
- العتبات مرنة وتتكيف مع طول المرحلة وصعوبتها
- 5 ملفات تم تعديلها + 1 ملف جديد (star-reward.tsx)
- التجربة البصرية: حركات توهج، جسيمات متطايرة، أصوات متصاعدة، نصائح لطيفة
- التجميع نظيف، لا أخطاء runtime، التطبيق يعمل على المنفذ 3000
- جاهز للاختبار اليدوي: افت أي مرحلة، أكملها، شاهد نجمة الإنجاز + توهج النجوم الإضافية

Artifacts:
- /home/z/my-project/src/lib/game-store.ts (محدّث)
- /home/z/my-project/src/lib/sound-effects.ts (محدّث)
- /home/z/my-project/src/components/game/star-reward.tsx (جديد)
- /home/z/my-project/src/components/game/game-screen.tsx (محدّث)
- /home/z/my-project/src/app/page.tsx (محدّث)
- /home/z/my-project/src/components/home/profile.tsx (محدّث)
- /home/z/my-project/src/app/globals.css (محدّث - animations جديدة)
