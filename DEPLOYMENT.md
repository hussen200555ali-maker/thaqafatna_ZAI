# 🚀 دليل النشر — مشروع ثقافتنا

## متغيرات البيئة المطلوبة (10 متغيرات)

| Variable | الوصف | كيف يُولَّد |
|---|---|---|
| `DATABASE_URL` | Neon pooled connection string | Neon dashboard → Connection Details → Pooled |
| `NEXTAUTH_SECRET` | مفتاح تشفير الجلسة (32+ حرف) | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | رابط الموقع الكامل | `https://your-domain.vercel.app` |
| `GITHUB_CLIENT_ID` | GitHub OAuth App ID | github.com/settings/developers |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth Secret | github.com/settings/developers → Generate |
| `TOTP_ENCRYPTION_KEY` | مفتاح تشفير AES-256 (64 hex) | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis URL | console.upstash.com → REST API |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis Token | console.upstash.com → REST API |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token | Vercel → Storage → Blob → Connect |
| `SENTRY_DSN` | Sentry DSN (اختياري) | sentry.io |

## إعدادات Vercel

| الإعداد | القيمة |
|---|---|
| **Framework** | Next.js |
| **Build Command** | `npm run build` |
| **Output Directory** | `.next` (default) |
| **Install Command** | `npm install` |
| **Node Version** | 20.x أو 22.x |

## إعدادات Prisma

- **Provider**: PostgreSQL
- **Binary targets**: `rhel-openssl-3.0.x` (Vercel's Linux)
- **Connection**: استخدم Neon `-pooler` endpoint
- **Migration**: `npx prisma migrate deploy` (يُشغَّل يدويًا أو في build)

## إعدادات NextAuth

### GitHub OAuth App

| الحقل | القيمة |
|---|---|
| **Homepage URL** | `https://your-domain.vercel.app` |
| **Authorization callback URL** | `https://your-domain.vercel.app/api/auth/callback/github` |

## مشاكل شائعة وحلولها

| المشكلة | السبب | الحل |
|---|---|---|
| `Prisma Client not found` | لم يُشغَّل `prisma generate` | أضف `postinstall: prisma generate` في package.json |
| `Connection pool exhausted` | Neon non-pooled | استخدم `-pooler` endpoint + `?pgbouncer=true` |
| `Edge runtime error` | Prisma في Edge | أضف `export const runtime = 'nodejs'` في route handlers |
| `NEXTAUTH_URL mismatch` | URL خاطئ | طابق `https://domain.com` بالضبط |
| `TOTP decrypt failed` | مفتاح مختلف بين البيئات | نفس `TOTP_ENCRYPTION_KEY` في كل بيئة |
| `Build timeout` | build بطيء | تأكد من `output: 'standalone'` في next.config |
| `Cannot find module 'preact'` | NextAuth v5 dependency | `npm install preact` |
| `lightningcss not found` | Windows binary مفقود | `npm install lightningcss-win32-x64-msvc` |

## خطوات النشر

### 1. إعداد Neon
```bash
# إنشاء قاعدة بيانات على Neon (Singapore region)
# نسخ Connection String (pooled)
```

### 2. إعداد GitHub OAuth
```bash
# github.com/settings/developers → New OAuth App
# Homepage URL: https://your-domain.vercel.app
# Callback URL: https://your-domain.vercel.app/api/auth/callback/github
```

### 3. إعداد Upstash Redis
```bash
# console.upstash.com → Create Database (Singapore)
# نسخ REST URL + REST Token
```

### 4. توليد المفاتيح
```bash
# NEXTAUTH_SECRET
openssl rand -base64 32

# TOTP_ENCRYPTION_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. إضافة متغيرات البيئة على Vercel
```bash
# Vercel → Project → Settings → Environment Variables
# أضف كل الـ 10 متغيرات (Type: Secret، Environments: All)
```

### 6. تطبيق Migration
```bash
# على جهازك المحلي
npx prisma migrate deploy
```

### 7. ترحيل المستخدمين
```bash
npx tsx scripts/migrate-users-to-auth.ts
```

### 8. النشر
```bash
git push origin main
# أو: vercel --prod
```

### 9. اختبار
```bash
# افتح /admin/login
# جرّب تسجيل الدخول + 2FA
```
