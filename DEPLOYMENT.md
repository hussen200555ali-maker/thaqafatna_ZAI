# 🚀 دليل النشر — مشروع ثقافتنا

> **آخر تحديث:** Sprint 5 — فصل migrations عن الـ build لأسباب أداء شبكة Vercel↔Neon.

## متغيرات البيئة المطلوبة (10 متغيرات)

> ⚠️ **تنبيه أسماء:** NextAuth v5 يقرأ `AUTH_*` وليس `NEXTAUTH_*`.
> لو عندك `NEXTAUTH_SECRET` و `NEXTAUTH_URL` على Vercel، أعد تسميتهم إلى `AUTH_SECRET` و `AUTH_URL`.

| Variable | الوصف | كيف يُولَّد |
|---|---|---|
| `DATABASE_URL` | Neon pooled connection string | Neon dashboard → Connection Details → Pooled |
| `DIRECT_URL` | Neon direct connection (لـ migrations) | Neon dashboard → Connection Details → Direct |
| `AUTH_SECRET` | مفتاح تشفير الجلسة (32+ حرف) | `openssl rand -base64 32` |
| `AUTH_URL` | رابط الموقع الكامل | `https://thaqafatna-qr.vercel.app` |
| `GITHUB_CLIENT_ID` | GitHub OAuth App ID | github.com/settings/developers |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth Secret | github.com/settings/developers → Generate |
| `TOTP_ENCRYPTION_KEY` | مفتاح تشفير AES-256 (64 hex) | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis URL | console.upstash.com → REST API |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis Token | console.upstash.com → REST API |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token | Vercel → Storage → Blob → Connect |

## إعدادات Vercel

| الإعداد | القيمة |
|---|---|
| **Framework** | Next.js |
| **Build Command** | `npm run build:vercel` (يولّد Prisma Client فقط، لا migrations) |
| **Output Directory** | `.next` (default) |
| **Install Command** | `npm install` |
| **Node Version** | 20.x أو 22.x |
| **Regions** | `sin1` (Singapore) — يفضّل لقربها من Neon |

## ⚠️ إدارة Prisma Migrations (Sprint 5 fix)

### المشكلة التي حُلّت

في الـ builds السابقة كنا نشغّل:
```bash
prisma generate && prisma migrate deploy && next build
```

ظهر خطأ:
```
Error: P1002 — Timed out trying to acquire a postgres advisory lock
Timeout: 10000ms
```

**السبب:** Vercel يبني في Washington D.C. (iad1)، بينما قاعدة بيانات Neon في Singapore (ap-southeast-1). المسافة الجغرافية الكبيرة + مهلة 10 ثوانٍ لقفل الـ migration = فشل.

### الحل المُطبَّق

فصلنا `prisma migrate deploy` عن الـ build:
- `build:vercel` الآن: `prisma generate && next build` (سريع — لا شبكة)
- `migrate:prod` منفصل: `prisma migrate deploy` (يُشغَّل يدويًا عند الحاجة)

### متى تشغّل migrations يدويًا؟

**قبل كل نشر** يحتوي على schema changes:
1. أنشئ migration محليًا:
   ```bash
   npx prisma migrate dev --name your_migration_name
   ```
2. commit الملفات في `prisma/migrations/`
3. **قبل** دفع الـ commit، شغّل migrations على الإنتاج:
   ```bash
   # اسحب متغيرات Vercel محليًا
   npx vercel env pull .env.vercel --environment=production

   # شغّل migrations يدويًا باستخدام DIRECT_URL
   source .env.vercel && npx prisma migrate deploy
   ```
4. ثم `git push origin main` — Vercel سيبني بسرعة بدون migrations

### لماذا هذا أفضل؟

| قبل | بعد |
|---|---|
| كل build يشغّل migrations | migrations يدوية فقط عند الحاجة |
| فشل شبكة = build فاشل | build سريع ومستقل عن الشبكة |
| مهلة 10s لقفل advisory | لا قفل أبدًا في الـ build |
| لا تتحكم في وقت الـ migration | تتحكم متى تشغّل migrations |

## إعدادات NextAuth

### GitHub OAuth App

| الحقل | القيمة |
|---|---|
| **Homepage URL** | `https://thaqafatna-qr.vercel.app` |
| **Authorization callback URL** | `https://thaqafatna-qr.vercel.app/api/auth/callback/github` |

## مشاكل شائعة وحلولها

| المشكلة | السبب | الحل |
|---|---|---|
| `Prisma Client not found` | لم يُشغَّل `prisma generate` | أضف `postinstall: prisma generate` في package.json |
| `Connection pool exhausted` | Neon non-pooled | استخدم `-pooler` endpoint + `?pgbouncer=true` |
| `Edge runtime error` | Prisma في Edge | أضف `export const runtime = 'nodejs'` في route handlers |
| `Edge Function size > 1 MB` | middleware يسحب Prisma/bcrypt/crypto | استخدم `auth.config.ts` (Edge-safe) بدلًا من `auth.ts` |
| `AUTH_URL mismatch` | URL خاطئ | طابق `https://thaqafatna-qr.vercel.app` بالضبط |
| `TOTP decrypt failed` | مفتاح مختلف بين البيئات | نفس `TOTP_ENCRYPTION_KEY` في كل بيئة |
| `Build timeout` | build بطيء | تأكد من `output: 'standalone'` في next.config |
| `Cannot find module 'preact'` | NextAuth v5 dependency | `npm install preact` |
| `EBADPLATFORM lightningcss-win32` | حزمة Windows في dependencies | احذفها — lightningcss يدير optionalDependencies تلقائيًا |
| `P1002 advisory lock timeout` | Vercel↔Neon شبكة بطيئة | ✅ مُصلح — فصلنا migrate عن build |
| `404 on icon-192.png` | manifest يطلب PNG غير موجود | شغّل `python3 scripts/generate-pwa-icons.py` |
| `404 on /admin/books` | صفحة مفقودة | ✅ مُنشأة `src/app/admin/books/page.tsx` |

## خطوات النشر الكاملة

### 1. إعداد Neon
```bash
# إنشاء قاعدة بيانات على Neon (Singapore region)
# نسخ Connection String pooled + direct
```

### 2. إعداد GitHub OAuth
```bash
# github.com/settings/developers → New OAuth App
# Homepage URL: https://thaqafatna-qr.vercel.app
# Callback URL: https://thaqafatna-qr.vercel.app/api/auth/callback/github
```

### 3. إعداد Upstash Redis
```bash
# console.upstash.com → Create Database (Singapore)
# نسخ REST URL + REST Token
```

### 4. توليد المفاتيح
```bash
# AUTH_SECRET
openssl rand -base64 32

# TOTP_ENCRYPTION_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. إضافة متغيرات البيئة على Vercel
```bash
# Vercel → Project → Settings → Environment Variables
# أضف كل الـ 10 متغيرات (Type: Secret، Environments: All)
# ⚠️ تأكد من الأسماء: AUTH_* وليس NEXTAUTH_*
```

### 6. تطبيق Migration (يدويًا، مرة واحدة)
```bash
# على جهازك المحلي — استخدم DIRECT_URL من Neon
export DATABASE_URL="postgresql://...neon.tech/neondb?sslmode=require"
npx prisma migrate deploy
# سترى: 3 migrations found → No pending migrations to apply (لو سبق تطبيقها)
```

### 7. النشر التلقائي
```bash
git push origin main
# Vercel سيبني تلقائيًا بدون migrations (سريع)
```

### 8. إنشاء حساب الأدمن
```bash
# بعد أول نشر ناجح، افتح في المتصفح:
# https://thaqafatna-qr.vercel.app/api/setup/admin
# احفظ بيانات الدخول (email + password)
# ⚠️ ثم احذف src/app/api/setup/admin/route.ts وأعد النشر
```

### 9. اختبار
```bash
# افتح /admin/login
# استخدم البريد أو اسم المستخدم + كلمة المرور
# جرّب 2FA بعد تفعيله من /admin/settings
```

## خطوات إضافة Migration جديد (سير العمل المستقبلي)

```bash
# 1. تعديل prisma/schema.prisma محليًا
# 2. إنشاء migration
npx prisma migrate dev --name add_new_feature

# 3. تطبيق migration على الإنتاج يدويًا (قبل الدفع)
npx vercel env pull .env.vercel --environment=production
source .env.vercel && npx prisma migrate deploy

# 4. التأكد من نجاح الـ migration
# 5. commit + push
git add prisma/migrations/
git commit -m "📦 Add migration: add_new_feature"
git push origin main
# Vercel سيبني بسرعة — migration مُطبّق بالفعل
```

## مرجع العمارة

```
┌────────────────────────────────────────────────────────────┐
│ Vercel Build (iad1, Washington DC)                        │
│  ├─ npm install (postinstall: prisma generate)             │
│  ├─ npm run build:vercel                                   │
│  │   ├─ prisma generate  (سريع، لا شبكة)                  │
│  │   └─ next build       (Turbopack, ~15-20s)             │
│  └─ deploy → .next/                                       │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ Vercel Edge Function (1 MB limit)                          │
│  └─ middleware.ts → auth.config.ts                         │
│     يقرأ JWT من cookie فقط (لا DB)                        │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ Vercel Node.js Functions (no size limit)                  │
│  ├─ /api/auth/[...nextauth] → auth.ts (GitHub + Creds)    │
│  ├─ /api/admin/* → auth.ts (يستخدم Prisma + bcrypt + 2FA) │
│  └─ /api/setup/admin → إنشاء أدمن (مؤقت)                  │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ Neon PostgreSQL (sin1, Singapore)                          │
│  └─ 3 migrations مُطبّقة (init + pdf + sprint0_security)  │
└────────────────────────────────────────────────────────────┘
```
