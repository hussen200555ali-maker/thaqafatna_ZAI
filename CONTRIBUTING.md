# CONTRIBUTING — قواعد المساهمة في مشروع ثقافتنا

## قواعد Git

### Branch Protection
- `main` محمي — لا يمكن الدفع المباشر
- كل تغيير يمر عبر Pull Request
- PR يحتاج موافقة واحدة على الأقل
- لا force push على `main` أبدًا
- لا `git reset --hard` على `main` أبدًا

### سير العمل
1. أنشئ branch جديد من `main`: `git checkout -b feature/your-feature`
2. اكتب الكود + اختبر محليًا
3. ادفع: `git push origin feature/your-feature`
4. أنشئ PR على GitHub
5. انتظر المراجعة
6. ادمج بعد الموافقة

### رسائل Commit
- استخدم صيغة واضحة: `📝 الوصف`
- اذكر رقم الـ issue إن وجد: `Fixes #123`

## قواعد الكود

### TypeScript
- استخدم types صريحة (لا `any` إلا عند الضرورة القصوى)
- فعّل `strict: true` في `tsconfig.json`
- لا أخطاء TypeScript في `next build`

### Prisma
- لا تعدّل `schema.prisma` بدون إنشاء migration
- استخدم `prisma migrate dev --name xxx` للتطوير
- استخدم `prisma migrate deploy` للإنتاج
- لا `prisma db push` على الإنتاج

### الأمان
- لا تخزّن أسرارًا في الكود (استخدم env vars)
- لا تستورد `crypto` أو `fs` في Edge Runtime (middleware)
- كل API إداري يجب أن يتحقق من الدور عبر `auth()`
- كل مدخلات المستخدم يجب أن تُعقَّم عبر `sanitizeText()`

## قواعد المراجعة

### ما يجب مراجعته:
- تغييرات في `prisma/schema.prisma`
- تغييرات في `src/lib/auth.ts` أو `crypto.ts` أو `middleware.ts`
- إضافة dependencies جديدة
- تغييرات في `next.config.ts` أو `vercel.json`

### ما لا يحتاج مراجعة:
- صفحات UI فقط (بدون تغييرات منطق)
- تحديثات README/توثيق
- إصلاحات typos

## البيئات

| البيئة | قاعدة البيانات | الاستخدام |
|--------|-------------|---------|
| محلي | SQLite / Neon dev | تطوير واختبار |
| Preview | Neon (same) | اختبار PR |
| Production | Neon (Singapore) | الموقع المباشر |
