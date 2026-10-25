# 🚀 دليل النشر الكامل — مشروع ثقافتنا

<div dir="rtl">

دليل خطوة بخطوة لنشر مشروع **ثقافتنا** على Vercel مع قاعدة بيانات PostgreSQL من Neon.

---

## 📋 المتطلبات

قبل البدء، تأكد من وجودك في:

- ✅ حساب **GitHub** (لديك المستودع مرفوع بالفعل)
- ✅ حساب **Vercel** (سجّل مجانًا على https://vercel.com)
- ✅ حساب **Neon** (سجّل مجانًا على https://neon.tech)
- ✅ رابط المستودع: `https://github.com/hussen200555ali-maker/thaqafatna_ZAI`

---

## 🗄️ الخطوة 1: إنشاء قاعدة بيانات PostgreSQL على Neon

### 1.1 سجّل الدخول إلى Neon
1. اذهب إلى: **https://neon.tech**
2. اضغط **Sign Up** أو **Login** (يمكنك التسجيل بحساب GitHub)
3. بعد الدخول، اضغط **New Project**

### 1.2 إعدادات المشروع
- **Project name**: `thaqafatna`
- **Postgres version**: `17` (الأحدث)
- **Region**: `Singapore (ap-southeast-1)` — مطابق لمنطقة Vercel
- **Compute size**: `Shared` (مجاني)
- **Branch**: `main`

### 1.3 الحصول على رابط الاتصال
1. بعد إنشاء المشروع، انتقل إلى تبويب **Connection Details**
2. اختر **Pooled connection** (للأداء الأفضل)
3. انسخ الـ Connection string، سيكون شكله:
   ```
   postgresql://neondb_owner:npg_xxxxxxx@ep-xxxxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```
4. احفظ هذا الرابط — ستحتاجه في الخطوة 3

> 💡 **ملاحظة**: تأكد أن الرابط ينتهي بـ `?sslmode=require` — هذا إلزامي لـ Vercel

---

## 🚀 الخطوة 2: استيراد المستودع إلى Vercel

### 2.1 ابدأ الاستيراد
1. اذهب إلى: **https://vercel.com/new**
2. سجّل دخولك بحساب GitHub
3. في قسم **Import Git Repository**، ابحث عن `thaqafatna_ZAI`
4. اضغط **Import**

### 2.2 إعدادات المشروع
- **Framework Preset**: Next.js (سيُكتشف تلقائيًا)
- **Root Directory**: `./` (افتراضي)
- **Build Command**: `npm run build:vercel` (موجود في `vercel.json`)
- **Output Directory**: `.next` (افتراضي)
- **Install Command**: `npm install`

### 2.3 ⚠️ لا تنشر بعد!
سنضيف متغيرات البيئة أولاً في الخطوة التالية. اضغط **Environment Variables** بدلاً من **Deploy**.

---

## 🔐 الخطوة 3: إضافة متغيرات البيئة (مهم جدًا)

في نفس صفحة الاستيراد، أضف المتغيرات التالية:

### المتغيرات الإلزامية

| Name | Value | Environment |
|------|-------|-------------|
| `DATABASE_URL` | (الصق رابط Neon من الخطوة 1.3) | Production, Preview, Development |

### المتغيرات الاختيارية (موصى بها)

| Name | Value | Environment |
|------|-------|-------------|
| `NEXT_PUBLIC_APP_NAME` | `ثقافتنا` | All |
| `NEXT_TELEMETRY_DISABLED` | `1` | All |

### كيفية الإضافة:
1. في حقل **Name**: اكتب اسم المتغير
2. في حقل **Value**: الصق القيمة
3. اختر البيئات (Production + Preview + Development لـ DATABASE_URL)
4. اضغط **Add**

> 🔒 **الأمان**: استخدم خيار **Sensitive** لـ `DATABASE_URL` لإخفائه عن أعضاء الفريق

---

## ⚙️ الخطوة 4: النشر الأول (Build + Deploy)

1. بعد إضافة كل المتغيرات، اضغط **Deploy**
2. سيبدأ Vercel بـ:
   - تثبيت الحزم (`npm install`)
   - توليد Prisma Client (`prisma generate`)
   - بناء Next.js (`next build`)
3. ستستغرق العملية **2-5 دقائق**

> ⚠️ **قد يفشل النشر الأول** — هذا طبيعي لأن قاعدة البيانات فارغة. سنصلح ذلك في الخطوة التالية.

---

## 🌱 الخطوة 5: تهيئة قاعدة البيانات (مهم جدًا)

بعد فشل النشر الأول (أو نجاحه)، نحتاج لإنشاء الجداول وزرع البيانات.

### الطريقة 1: عبر Vercel CLI (موصى بها)

#### 5.1 تثبيت Vercel CLI محليًا
```bash
npm install -g vercel
vercel login
```

#### 5.2 ربط المشروع المحلي بـ Vercel
```bash
cd thaqafatna_ZAI
vercel link  # اتبع التعليمات لاختيار المشروع
```

#### 5.3 سحب متغيرات البيئة
```bash
vercel env pull .env.local
```
سيُنشئ ملف `.env.local` يحتوي على `DATABASE_URL` الخاص بـ Neon.

#### 5.4 إنشاء الجداول في PostgreSQL
```bash
npx prisma migrate dev --name init
```
سيقوم Prisma بإنشاء كل الجداول (23 نموذج) في قاعدة بيانات Neon.

#### 5.5 زرع البيانات الأولية
```bash
npm run db:seed
```
سيُضيف:
- 3 فصول + مراحل وألغاز
- 8 تصنيفات كتب
- 30 كتاب عربي + 68 فصل
- 20 مهارة تكيّفية
- بيانات تجريبية أخرى

#### 5.6 إعادة النشر على Vercel
```bash
vercel --prod
```

### الطريقة 2: عبر Neon Console (بديلة)

إذا لم تستطع استخدام Vercel CLI:
1. اذهب إلى لوحة تحكم Neon
2. افتح **SQL Editor**
3. اذهب إلى تبويب **Migrations** في Vercel dashboard لمشاهدة سجل الـ SQL
4. انسخ الـ SQL من `prisma/migrations/*/migration.sql` ونفّذه في Neon

---

## ✅ الخطوة 6: التحقق من النشر

1. اذهب إلى: https://thaqafatna.vercel.app (أو الرابط الذي أعطاك Vercel)
2. تحقق من الصفحات التالية:

| الصفحة | الرابط | يجب أن ترى |
|--------|------|-------------|
| الرئيسية | `/` | واجهة Onboarding |
| المكتبة | `/library` | 30 كتاب عربي |
| صفحة كتاب | `/library/1` | تفاصيل كتاب + كتب ذات صلة |
| قارئ | `/library/reader/1/1` | محتوى الفصل |
| لوحة المتصدرين | `/leaderboard` | قائمة فارغة (طبيعي) |

3. اختبر الـ APIs:

```bash
# اختبر API الكتب
curl https://thaqafatna.vercel.app/api/books

# يجب أن يرجع JSON يحتوي على 30 كتاب
```

---

## 🔄 الخطوة 7: النشر التلقائي (CI/CD)

بمجرد ربط المستودع بـ Vercel، **كل push إلى `main` سيُطلق نشر تلقائي**.

### لتطوير ميزة جديدة:

```bash
# 1. أنشئ branch جديد
git checkout -b feature/new-feature

# 2. عدّل الكود
# ...

# 3. ادفع إلى GitHub
git push origin feature/new-feature

# 4. Vercel سينشر preview تلقائيًا
# 5. بعد المراجعة، ادمج الـ PR
# 6. سيُنشر على production تلقائيًا
```

---

## 🆘 حل المشاكل الشائعة

### مشكلة 1: `DATABASE_URL` غير مُعرّف
**السبب**: نسيت إضافة متغير البيئة في Vercel
**الحل**: اذهب إلى Project Settings → Environment Variables → أضف `DATABASE_URL`

### مشكلة 2: `Prisma Client not generated`
**السبب**: `postinstall` لم يُشغّل
**الحل**: تأكد أن `package.json` يحتوي على:
```json
"postinstall": "prisma generate"
```

### مشكلة 3: `Relation does not exist`
**السبب**: لم تُنشأ الجداول بعد
**الحل**: نفّذ `npx prisma migrate dev --name init` محليًا (الخطوة 5.4)

### مشكلة 4: صفحة فارغة بعد النشر
**السبب**: قاعدة البيانات فارغة
**الحل**: نفّذ `npm run db:seed` (الخطوة 5.5)

### مشكلة 5: خطأ في الاتصال بـ Neon
**السبب**: قد يكون رابط الاتصال خاطئًا
**الحل**: تأكد أن الـ URL ينتهي بـ `?sslmode=require`

---

## 📊 مراقبة الأداء

### Vercel Analytics (مجاني)
1. اذهب إلى Project Settings → Analytics
2. فعّل **Web Analytics** (مجاني)
3. ستحصل على إحصائيات المشاهدات والأداء

### Neon Monitoring
1. اذهب إلى لوحة تحكم Neon
2. تبويب **Monitoring** لإحصائيات DB
3. تبويب **Branches** لإدارة بيئات dev/prod

---

## 🔒 الأمان

### إعدادات Neon الموصى بها
- ✅ فعّل **Point-in-time recovery**
- ✅ فعّل **Logical replication** (إذا خطّطت لـ read replicas)
- ✅ استخدم **Connection pooling** دائمًا

### Vercel
- ✅ استخدم **Preview deployments** لكل PR
- ✅ فعّل **Vercel Authentication** للـ previews (إذا فريق)
- ✅ راجع **Deployment Logs** بشكل دوري

---

## 🎉 تهانينا!

مشروع **ثقافتنا** متاح الآن على الإنترنت بنجاح! 🌍

### روابط مفيدة:
- 🏠 المستودع: https://github.com/hussen200555ali-maker/thaqafatna_ZAI
- 🚀 Vercel: https://vercel.com/dashboard
- 🗄️ Neon: https://console.neon.tech
- 📚 Prisma Docs: https://pris.ly/d/prisma-schema

---

### 💡 نصيحة أخيرة

بعد النشر الناجح، **احذف الـ GitHub token** الذي أنشأته للرفع:
1. اذهب إلى: https://github.com/settings/tokens
2. ابحث عن `thaqafatna-deploy`
3. اضغط **Delete**

</div>
