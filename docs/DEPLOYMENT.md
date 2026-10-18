# 🚀 دليل النشر الكامل — ثقافتنا على Vercel

> **النسخة**: 1.0.0  
> **التاريخ**: 2026-10-13  
> **المنصة المستهدفة**: Vercel + Neon PostgreSQL  
> **الزمن المتوقع**: 15-20 دقيقة

---

## 📋 جدول المحتويات

1. [نظرة عامة](#1-نظرة-عامة)
2. [المتطلبات قبل النشر](#2-المتطلبات-قبل-النشر)
3. [الخطوة 1: إنشاء قاعدة بيانات Neon](#الخطوة-1-إنشاء-قاعدة-بيانات-neon)
4. [الخطوة 2: رفع المشروع إلى GitHub](#الخطوة-2-رفع-المشروع-إلى-github)
5. [الخطوة 3: النشر على Vercel](#الخطوة-3-النشر-على-vercel)
6. [الخطوة 4: إعداد متغيرات البيئة](#الخطوة-4-إعداد-متغيرات-البيئة)
7. [الخطوة 5: تهيئة قاعدة البيانات](#الخطوة-5-تهيئة-قاعدة-البيانات)
8. [الخطوة 6: التحقق من النشر](#الخطوة-6-التحقق-من-النشر)
9. [استكشاف الأخطاء وإصلاحها](#استكشاف-الأخطاء-وإصلاحها)
10. [النشر البديل (Railway)](#النشر-البديل-railway)

---

## 1. نظرة عامة

### البنية المعمارية بعد النشر:
```
┌─────────────────────┐     ┌─────────────────────┐
│   Vercel (Frontend) │ ←→ │  Neon (PostgreSQL) │
│   - Next.js 16      │     │  - 14 نموذج DB     │
│   - 14 API routes   │     │  - 20 مهارة        │
│   - 12 صفحة         │     │  - Serverless      │
└─────────────────────┘     └─────────────────────┘
         ↑                           ↑
         │                           │
    المستخدمون              بيانات اللعب + التحليلات
   (عالمي، CDN)              (مزامنة سحابية)
```

### لماذا Vercel + Neon؟
- ✅ **مجاني** لكلا الخدمتين (للاستخدام الشخصي)
- ✅ **Serverless** — يتمدد تلقائياً مع الحمل
- ✅ **CDN عالمي** — سرعة عالية لكل المناطق
- ✅ **HTTPS تلقائي** — أمان من اليوم الأول
- ✅ **Preview deployments** — لكل branch

---

## 2. المتطلبات قبل النشر

### الأدوات المطلوبة:
- ✅ حساب GitHub (مجاني)
- ✅ حساب Vercel (مجاني — سجّل بـ GitHub)
- ✅ حساب Neon (مجاني — سجّل بـ GitHub)

### الملفات الجاهزة في المشروع:
- ✅ `vercel.json` — إعدادات النشر
- ✅ `.env.example` — نموذج متغيرات البيئة
- ✅ `prisma/schema.prisma` — مُعدّ لـ PostgreSQL
- ✅ `package.json` — scripts محدّثة
- ✅ `next.config.ts` — مُعدّ للإنتاج

---

## الخطوة 1: إنشاء قاعدة بيانات Neon

### 1.1 اذهب إلى Neon
```
https://neon.tech
```
اضغط **Sign Up** → سجّل بـ GitHub.

### 1.2 أنشئ مشروع جديد
1. اضغط **New Project**
2. اختر:
   - **Name**: `thaqafatna-db`
   - **Region**: `Singapore (ap-southeast-1)` — الأقرب للسعودية
   - **Postgres version**: 16 (الأحدث)
3. اضغط **Create Project**

### 1.3 انسخ connection string
بعد إنشاء المشروع، سترى:
```
postgresql://thaqafatna_user:password@ep-xxx-xxx.aws.neon.tech/thaqafatna?sslmode=require
```
**احفظ هذا الرابط** — ستحتاجه في الخطوة 4.

---

## الخطوة 2: رفع المشروع إلى GitHub

### 2.1 أنشئ repository جديد على GitHub
1. اذهب إلى: `https://github.com/new`
2. **Repository name**: `thaqafatna`
3. اختر **Private** أو **Public**
4. **لا تختر** "Add README" (لدينا واحد)
5. اضغط **Create repository**

### 2.2 ارفع المشروع من جهازك
في terminal على جهازك (بعد فك ضغط الأرشيف):

```bash
cd thaqafatna

# تهيئة git
git init
git add .
git commit -m "🚀 Initial commit: thaqafatna v2 with adaptive knowledge map"

# اربط بـ GitHub (استبدل USERNAME باسمك)
git remote add origin https://github.com/USERNAME/thaqafatna.git
git branch -M main
git push -u origin main
```

---

## الخطوة 3: النشر على Vercel

### 3.1 اذهب إلى Vercel
```
https://vercel.com
```
اضغط **Sign Up** → **Continue with GitHub**.

### 3.2 استورد المشروع
1. اضغط **Add New...** → **Project**
2. اختر repository `thaqafatna` من قائمة GitHub
3. Vercel سيكتشف تلقائياً أنه Next.js

### 3.3 إعدادات النشر
| الحقل | القيمة |
|---|---|
| **Framework Preset** | Next.js (تلقائي) |
| **Build Command** | `npm run build:vercel` |
| **Output Directory** | `.next` (تلقائي) |
| **Install Command** | `npm install` (تلقائي) |

---

## الخطوة 4: إعداد متغيرات البيئة

في نفس صفحة Vercel، أضف:

| Key | Value |
|---|---|
| `DATABASE_URL` | `[connection string من Neon]` |

مثال:
```
postgresql://thaqafatna_user:password@ep-xxx.aws.neon.tech/thaqafatna?sslmode=require
```

أضف لكل البيئات:
- ✅ **Production**
- ✅ **Preview**
- ✅ **Development**

اضغط **Deploy** — ستبدأ عملية النشر (2-3 دقائق).

---

## الخطوة 5: تهيئة قاعدة البيانات

```bash
# على جهازك
npm i -g vercel
cd thaqafatna
vercel env pull .env

# طبّق الـ schema على قاعدة بيانات Neon
npx prisma db push

# زرع المهارات (20 مهارة)
npx tsx scripts/seed-skills.ts

# (اختياري) بيانات تجريبية
npx tsx scripts/seed-db.ts

# (اختياري) إنشاء مرحلة لغز صوتي
npx tsx scripts/create-audio-level.ts
```

---

## الخطوة 6: التحقق من النشر

### 6.1 افتح رابط الإنتاج
```
https://thaqafatna-xxx.vercel.app
```

### 6.2 اختبر الصفحات
| الصفحة | المتوقع |
|---|---|
| `/` | صفحة ترحيب + توصية ذكية |
| `/api/skills` | JSON بـ 20 مهارة |
| `/api/chapters` | JSON بـ 8 فصول |
| `/api/admin/difficulty-check` | JSON بتقرير الموازنة |
| `/api/analytics?userId=test` | تحليلات (قد تكون فارغة) |

### 6.3 اختبر التدفّق الكامل
1. افتح الصفحة الرئيسية
2. اضغط أي مرحلة → ستظهر شاشة الأهداف التربوية
3. أكمل الأسئلة
4. شاهد نظام النجوم
5. ارجع للرئيسية → سترى توصية محدّثة
6. افتح "خريطتي" → سترى المهارات
7. افتح "تحليلاتي" → سترى لوحة التحليلات

---

## استكشاف الأخطاء وإصلاحها

### ❌ خطأ: `Database connection failed`
- تحقق من `DATABASE_URL` في Vercel env vars
- تأكد أن ينتهي بـ `?sslmode=require`
- في Neon Dashboard، تأكد أن project **Active**

### ❌ خطأ: `Prisma Client not generated`
- تحقق أن `package.json` يحوي `"postinstall": "prisma generate"`

### ❌ بطء في APIs (timeout)
- Neon cold start (2-3 ثوانٍ بعد عدم النشاط)
- في Neon، فعّل **Auto-suspend**: 5 دقائق

### ❌ الصفحة الرئيسية فارغة
- افتح F12 → Console للأخطاء
- امسح Local Storage: F12 → Application → Local Storage → Clear All

---

## النشر البديل: Railway

### 1. اذهب إلى Railway
```
https://railway.app
```

### 2. أنشئ مشروع من GitHub
- **New Project** → **Deploy from GitHub repo**
- اختر `thaqafatna`

### 3. أضف PostgreSQL
- **+ Add** → **Database** → **PostgreSQL**

### 4. أضف متغيرات البيئة
- في **Variables** tab، أضف `DATABASE_URL` من PostgreSQL

### 5. إعداد Build
```bash
Build Command: npm run build:vercel
Start Command: npm run start
```

---

## ✅ قائمة التحقق النهائية

- [ ] المشروع مرفوع على GitHub
- [ ] حساب Vercel مفعّل
- [ ] حساب Neon مفعّل + project منشأ
- [ ] `DATABASE_URL` مضاف في Vercel
- [ ] النشر نجح (لا أخطاء في logs)
- [ ] الصفحة الرئيسية تُحمّل (200 OK)
- [ ] `/api/skills` يرجع 20 مهارة
- [ ] `/api/admin/difficulty-check` يرجع تقرير الموازنة
- [ ] قاعدة البيانات فيها 14 جدول
- [ ] المهارات مزروعة (20 مهارة)
- [ ] يمكنك لعب مرحلة بنجاح
- [ ] شاشة الأهداف التربوية تظهر قبل بدء المرحلة
- [ ] التوصية الذكية تظهر في الصفحة الرئيسية
- [ ] خريطة المعرفة تعرض المهارات
- [ ] لوحة التحليلات تعمل
- [ ] مدقّق الجودة يعمل في لوحة الإدارة
- [ ] موازن الصعوبة يعمل في لوحة الإدارة

---

## 🎉 بعد النشر الناجح

بعد إكمال كل شيء، ستحصل على:
- 🌐 **رابط إنتاج** (production URL)
- 🔍 **Preview URLs** لكل branch
- 📊 **Analytics** مدمجة في Vercel
- 🚀 **Auto-deploy** عند كل push إلى main
- 🔄 **Environment variables** مشفّرة

**تهانينا!** تطبيقك متاح للعالم الآن! 🎉
