# 📡 API Reference — منصة ثقافتنا

> **الإصدار:** Sprint 5 — نوفمبر 2026
> **Base URL:** `https://thaqafatna-qr.vercel.app`
> **Authentication:** NextAuth v5 (JWT in cookies)

## 📋 الفهرس

- [المصادقة (Auth)](#-المصادقة-auth)
- [2FA + Backup Codes](#-2fa--backup-codes)
- [الكتب العامة (Public Books)](#-الكتب-العامة-public-books)
- [الفصول والمحتوى](#-الفصول-والمحتوى)
- [التصنيفات والمؤلفون](#-التصنيفات-والمؤلفون)
- [تقدّم القراءة والمراجعات](#-تقدّم-القراءة-والمراجعات)
- [APIs الإدارية (Admin APIs)](#-apis-الإدارية-admin-apis)
- [إدارة الكتب (Admin Books)](#-إدارة-الكتب-admin-books)
- [إدارة المستخدمين والأدوار](#-إدارة-المستخدمين-والأدوار)
- [الاعتدال والتدقيق](#-الاعتدال-والتدقيق)
- [اللوحات والتقارير](#-اللوحات-والتقارير)
- [التواصل والإعداد](#-التواصل-والإعداد)
- [الألعاب والمهارات](#-الألعاب-والمهارات)

---

## 🔐 المصادقة (Auth)

### NextAuth Routes
| Method | Endpoint | الأدوار | الوصف |
|--------|----------|--------|------|
| `GET/POST` | `/api/auth/[...nextauth]` | عام | NextAuth handler (signin, signout, session, callback) |

### Check 2FA Status
```http
POST /api/admin/check-2fa
```
**الوصف:** يتحقق من البريد + كلمة المرور، ويُحدد هل 2FA مطلوب.
**الأدوار:** عام (لكن مخصص للأدمن)
**Rate Limit:** 3 محاولات / 15 دقيقة

**Body:**
```json
{
  "email": "admin@thaqafatna.com",
  "password": "secret123"
}
```

**Response (200):**
```json
{
  "requiresTwoFactor": true,
  "userId": "clxxxxx"
}
```

**Response (429):**
```json
{
  "locked": true,
  "lockoutMinutes": 15,
  "message": "تم تجاوز عدد المحاولات المسموحة"
}
```

---

## 🔑 2FA + Backup Codes

### Setup 2FA
```http
POST /api/admin/2fa/setup
```
**الأدوار:** `admin` | `librarian` | `assistant`
**الوصف:** يُنشئ سر TOTP جديد ويُرجّع QR code + secret

**Response:**
```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCode": "data:image/png;base64,...",
  "url": "otpauth://totp/..."
}
```

### Verify 2FA
```http
POST /api/admin/2fa/verify
```
**الأدوار:** `admin` | `librarian` | `assistant`

**Body:**
```json
{ "token": "123456" }
```

### Generate Backup Codes (Sprint 5 A.2)
```http
POST /api/admin/2fa/backup-codes/generate
```
**الأدوار:** `admin` | `librarian` | `assistant`
**الوصف:** يولّد 10 رموز احتياطية، يحذف القديمة، يُرجّع الرموز مرة واحدة فقط

**Response (200):**
```json
{
  "success": true,
  "codes": ["ABCD-EFGH", "JKLM-NPQR", "..."],
  "count": 10,
  "remaining": 10,
  "warning": "احفظ هذه الرموز في مكان آمن — لن تظهر مرة أخرى",
  "generatedAt": "2026-11-01T12:00:00.000Z"
}
```

### Get Backup Codes Status
```http
GET /api/admin/2fa/backup-codes/generate
```
**الأدوار:** `admin` | `librarian` | `assistant`
**الوصف:** يُرجّع عدد الرموز المتبقية (لا يكشف الرموز نفسها)

**Response:**
```json
{ "remaining": 7, "total": 10, "used": 3 }
```

### Verify Backup Code
```http
POST /api/admin/2fa/backup-codes/verify
```
**الأدوار:** `admin` | `librarian` | `assistant`

**Body:**
```json
{ "code": "ABCD-EFGH" }
```

**Response (نجاح):**
```json
{
  "success": true,
  "remaining": 9,
  "message": "تم استهلاك الرمز. يمكنك استخدامه مرة واحدة فقط."
}
```

**Response (فشل):**
```json
{ "success": false, "error": "رمز غير صحيح أو مستهلك" }
```

---

## 📚 الكتب العامة (Public Books)

### List Books
```http
GET /api/books?limit=20&category=1&difficulty=medium
```
**الأدوار:** عام
**Query Params:** `limit`, `category`, `difficulty`, `sort`

**Response:**
```json
{
  "books": [
    {
      "id": 1,
      "title": "مقدمة ابن خلدون",
      "author": "عبد الرحمن بن خلدون",
      "coverImage": "https://...",
      "pdfUrl": "https://...",
      "difficulty": "medium",
      "ratingAvg": 4.2,
      "ratingCount": 1243,
      "views": 12453,
      "downloads": 3287,
      "category": { "id": 3, "name": "التاريخ والتراث", "icon": "📜" }
    }
  ]
}
```

### Get Book Details
```http
GET /api/books/{id}?userId=xxx
```
**الأدوار:** عام
**Query:** `userId` (اختياري — لإرجاع تقدّم القراءة)

### Featured Books
```http
GET /api/books/featured
```

### Search Books
```http
GET /api/books/search?q=ابن خلدون
```

### Recommended Books
```http
GET /api/books/recommend?userId=xxx&limit=4
```

### Books by Author
```http
GET /api/books/by-author?author=عبد الرحمن بن خلدون
```

### List Authors
```http
GET /api/books/authors
```

### My Library (Bookmarks)
```http
GET /api/books/my-library?userId=xxx
```

---

## 📖 الفصول والمحتوى

### Book Chapters
```http
GET /api/books/{id}/chapters
GET /api/books/{id}/chapters/{chapterId}
```

### Download PDF
```http
GET /api/books/{id}/download
```
**Rate Limit:** 10 تنزيلات / ساعة / مستخدم

### Reading Progress
```http
GET  /api/books/{id}/progress?userId=xxx
POST /api/books/{id}/progress
```

**Body (POST):**
```json
{ "userId": "xxx", "chapterId": 5, "progress": 0.75 }
```

### Bookmark
```http
POST /api/books/{id}/bookmark
DELETE /api/books/{id}/bookmark
```

### Certificate
```http
GET /api/books/{id}/certificate?userId=xxx
```

---

## 📂 التصنيفات والمؤلفون

### Categories
```http
GET /api/book-categories
```

**Response:**
```json
{
  "categories": [
    {
      "id": 1,
      "name": "الأدب العربي",
      "icon": "📖",
      "color": "linear-gradient(135deg, #3b82f6, #1e3a8a)",
      "slug": "arabic-literature",
      "isPublished": true,
      "_count": { "books": 17 }
    }
  ]
}
```

### General Chapters (Game Levels)
```http
GET /api/chapters
GET /api/levels
```

---

## ⭐ تقدّم القراءة والمراجعات

### Submit Review
```http
POST /api/books/{id}/review
```
**الأدوار:** `reader`+
**Rate Limit:** 5 مراجعات / ساعة

**Body:**
```json
{ "rating": 5, "content": "كتاب رائع جدًا", "userId": "xxx" }
```

### Get Reviews
```http
GET /api/review?bookId=1
```

### Progress (Game)
```http
GET /api/progress?userId=xxx
POST /api/progress
```

### Notifications
```http
GET /api/notifications?userId=xxx
```

---

## 🛠️ APIs الإدارية (Admin APIs)

> جميع هذه APIs تتطلب جلسة `admin` / `librarian` / `assistant`

### Dashboard
```http
GET /api/admin/dashboard
```

**Response:**
```json
{
  "stats": {
    "totalBooks": 36,
    "publishedBooks": 28,
    "totalUsers": 73,
    "pendingReviews": 7,
    "newMessages": 0,
    "totalDownloads": 3287,
    "criticalLogs": 0
  },
  "recentActivity": [...]
}
```

### Difficulty Check
```http
POST /api/admin/difficulty-check
```

### Import PDF
```http
POST /api/admin/import-pdf
```

---

## 📚 إدارة الكتب (Admin Books)

### List Books (Admin)
```http
GET /api/admin/books
```

### Create / Update / Delete Book
```http
POST   /api/admin/books
GET    /api/admin/books/{id}
PUT    /api/admin/books/{id}
PATCH  /api/admin/books/{id}
DELETE /api/admin/books/{id}
```

**Body (POST/PUT):**
```json
{
  "title": "مقدمة ابن خلدون",
  "author": "عبد الرحمن بن خلدون",
  "description": "...",
  "categoryId": 3,
  "difficulty": "medium",
  "pages": 412,
  "readingTimeMin": 65,
  "language": "ar",
  "keywords": "تاريخ, اجتماع, فلسفة",
  "status": "published"
}
```

### Upload Cover Image
```http
POST /api/admin/books/{id}/upload-cover
```
**Content-Type:** `multipart/form-data`
**Headers:** `x-admin-key: thaqafatna-admin-2026`
**Max Size:** 5 MB
**Formats:** JPG, PNG, WebP

**Body:** `file: <binary>`

**Response:**
```json
{
  "success": true,
  "coverImage": "https://vercel-blob.com/...",
  "fileName": "cover.jpg",
  "size": 234567
}
```

### Upload PDF
```http
POST /api/admin/books/{id}/upload-pdf
```
**Max Size:** 50 MB
**Formats:** PDF only

### Book Versions
```http
GET /api/admin/books/{id}/versions
POST /api/admin/books/{id}/versions
```

### Chapters Management
```http
GET  /api/admin/chapters
POST /api/admin/chapters
```

### Levels Management
```http
GET    /api/admin/levels
POST   /api/admin/levels
GET    /api/admin/levels/{id}
PUT    /api/admin/levels/{id}
DELETE /api/admin/levels/{id}
POST   /api/admin/levels/{id}/duplicate
POST   /api/admin/levels/{id}/publish
```

---

## 👥 إدارة المستخدمين والأدوار

### Users
```http
GET /api/admin/users
PUT /api/admin/users/{id}
DELETE /api/admin/users/{id}
```

### Change User Role (with Lockout Prevention)
```http
PATCH /api/admin/users/{id}/role
```
**الأدوار:** `admin` فقط
**الأمان:** يمنع الأدمن من خفض دوره الخاص (lockout prevention — A.5)

**Body:**
```json
{ "role": "librarian" }
```

**Response (403 لو lockout):**
```json
{
  "error": "لا يمكن للأدمن خفض دوره الخاص (منع القفل)"
}
```

### Roles Matrix
صفحة فقط: `/admin/roles` (لا API مستقل — البيانات من `src/lib/rbac.ts`)

---

## 💬 الاعتدال والتدقيق

### Reviews Moderation
```http
GET    /api/admin/reviews
PATCH  /api/admin/reviews/{id}    # approve/reject
DELETE /api/admin/reviews/{id}
```

**Body (PATCH):**
```json
{ "status": "approved" }  // or "rejected"
```

### Contact Messages
```http
GET  /api/admin/messages
PATCH /api/admin/messages/{id}    # mark as read/replied
DELETE /api/admin/messages/{id}
```

### Audit Logs
```http
GET /api/admin/audit-logs?limit=100&action=LOGIN&severity=critical
```
**الأدوار:** `admin` فقط

**Query Params:** `limit`, `action`, `severity`, `userId`, `from`, `to`

**Response:**
```json
{
  "logs": [
    {
      "id": "clxxxxx",
      "action": "LOGIN_FAILED",
      "entityType": "User",
      "entityId": null,
      "severity": "critical",
      "userName": "unknown",
      "ip": "91.221.x.x",
      "createdAt": "2026-11-01T12:00:00.000Z"
    }
  ]
}
```

---

## 📊 اللوحات والتقارير

### Dashboard (مكرر للأمان)
```http
GET /api/admin/dashboard
```

### Analytics
```http
GET /api/analytics?range=30d
```
**Max Duration:** 30s

### Knowledge Map
```http
GET /api/knowledge-map?userId=xxx
```

### Leaderboard
```http
GET /api/leaderboard
```

---

## 📞 التواصل والإعداد

### Contact Form
```http
POST /api/contact
```
**الأدوار:** عام
**الأمان:** مدخلات مُعقّمة بـ DOMPurify

**Body:**
```json
{
  "name": "أحمد المصري",
  "email": "ahmed@example.com",
  "subject": "استفسار عن كتاب",
  "message": "أريد معرفة..."
}
```

### Setup Admin (مؤقت — احذفه!)
```http
GET /api/setup/admin
```
**⚠️ تحذير:** يُنشئ حساب أدمن. احذف هذا الـ endpoint بعد الاستخدام!

---

## 🎮 الألعاب والمهارات

### AI Tutor
```http
POST /api/ai-tutor
```
**Max Duration:** 60s

**Body:**
```json
{ "question": "ما معنى العمران البشري؟", "context": "..." }
```

### Skills
```http
GET /api/skills?userId=xxx
```

### Knowledge Map
```http
GET /api/knowledge-map?userId=xxx
```

---

## 🔒 متغيرات البيئة المطلوبة

| Variable | الوصف | مطلوب لـ |
|----------|------|----------|
| `DATABASE_URL` | Neon pooled connection | الكل |
| `DIRECT_URL` | Neon direct connection | Prisma migrations |
| `AUTH_SECRET` | مفتاح JWT (32+ chars) | NextAuth |
| `AUTH_URL` | Site URL | NextAuth |
| `GITHUB_CLIENT_ID` | GitHub OAuth App ID | OAuth login |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth Secret | OAuth login |
| `TOTP_ENCRYPTION_KEY` | 64 hex chars (32 bytes) | 2FA encryption |
| `UPSTASH_REDIS_REST_URL` | Upstash URL | Rate Limiting |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Token | Rate Limiting |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token | File uploads |
| `ADMIN_KEY` | Admin secret key | Upload APIs |

---

## 📐 Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/admin/check-2fa` | 3 | 15 min |
| `/api/admin/login` | 3 | 15 min |
| `/api/books/{id}/download` | 10 | 1 hour |
| `/api/books/{id}/review` | 5 | 1 hour |
| `/api/books/search` | 60 | 1 min |
| Admin actions | 100 | 1 hour |

---

## 📝 ملاحظات

1. **كل APIs الإدارية تتطلب جلسة NextAuth صالحة**
2. **`x-admin-key` header مطلوب فقط لرفع الملفات** (`thaqafatna-admin-2026`)
3. **CORS:** مُفعّل على `/manifest.json` فقط
4. **Rate Limiting معطّل في dev mode** (لو Upstash غير مُعدّ)
5. **كل POST/PUT/PATCH/DELETE تُسجّل في AuditLog**
