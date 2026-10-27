-- Migration: Sprint 0 — Security + Metadata + Versions (REVISED v2)
-- Generated for: thaqafatna_ZAI
-- Date: 2026-10-26
-- Revisions v2 (after senior review #2):
--   1. Added enum ReviewStatus (was String) — closes inconsistency
--   2. Added foreign key for ContactMessage.convertedBookId → Book
--   3. Cleaned BookChapter (removed number + readingTimeMin duplicates)
--   4. Added Book.status as BookStatus enum
--   5. Documented twoFactorSecret encryption in comment
--
-- Revisions v1 (kept from previous):
--   - AuditSeverity as enum (not String)
--   - ContactStatus as enum
--   - Partial unique index on BookVersion (only one isActive=true per book)
--   - Renamed AuthorContact → ContactMessage with reply/conversion fields
--   - Old reviews stay as 'pending' (NOT auto-approved)

-- ===== 1. تحديث BookChapter: حذف number + readingTimeMin، إضافة order + pageStart + pageEnd + estimatedMinutes =====
-- (إصلاح #4: تنظيف الحقول المكررة)

-- إضافة الأعمدة الجديدة أولاً
ALTER TABLE "BookChapter" ADD COLUMN IF NOT EXISTS "order" INTEGER;
ALTER TABLE "BookChapter" ADD COLUMN IF NOT EXISTS "pageStart" INTEGER;
ALTER TABLE "BookChapter" ADD COLUMN IF NOT EXISTS "pageEnd" INTEGER;
ALTER TABLE "BookChapter" ADD COLUMN IF NOT EXISTS "estimatedMinutes" INTEGER;

-- تعبئة order من number (للبيانات الموجودة قبل الحذف)
UPDATE "BookChapter" SET "order" = "number" WHERE "order" IS NULL AND "number" IS NOT NULL;

-- تعبئة estimatedMinutes من readingTimeMin (قبل الحذف)
UPDATE "BookChapter" SET "estimatedMinutes" = "readingTimeMin" WHERE "estimatedMinutes" IS NULL;

-- جعل order NOT NULL بعد التعبئة
ALTER TABLE "BookChapter" ALTER COLUMN "order" SET NOT NULL;
ALTER TABLE "BookChapter" ALTER COLUMN "estimatedMinutes" SET DEFAULT 5;

-- حذف الأعمدة المكررة (number + readingTimeMin)
ALTER TABLE "BookChapter" DROP COLUMN IF EXISTS "number";
ALTER TABLE "BookChapter" DROP COLUMN IF EXISTS "readingTimeMin";

-- فهرس مركّب للترتيب
CREATE INDEX IF NOT EXISTS "BookChapter_bookId_order_idx" ON "BookChapter"("bookId", "order");

-- قيد فريد على (bookId, order) — استبدال القديم (bookId, number)
CREATE UNIQUE INDEX IF NOT EXISTS "BookChapter_bookId_order_key" ON "BookChapter"("bookId", "order");

-- ===== 2. تحديث BookReview: إضافة status (enum) + moderation fields =====
-- (إصلاح #3: status كـ enum وليس String)

-- إنشاء نوع enum
CREATE TYPE "ReviewStatus" AS ENUM ('pending', 'approved', 'rejected');

-- إضافة الأعمدة الجديدة
ALTER TABLE "BookReview" ADD COLUMN "status" "ReviewStatus" NOT NULL DEFAULT 'pending';
ALTER TABLE "BookReview" ADD COLUMN "rejectionReason" TEXT;
ALTER TABLE "BookReview" ADD COLUMN "moderatedBy" TEXT;
ALTER TABLE "BookReview" ADD COLUMN "moderatedAt" TIMESTAMP(3);

-- IMPORTANT: المراجعات القديمة تبقى 'pending' (DEFAULT) — لا توافق تلقائية
-- سيقوم الأدمن بمراجعتها يدويًا في /admin/reviews

-- فهارس للفلترة حسب الحالة
CREATE INDEX IF NOT EXISTS "BookReview_status_createdAt_idx" ON "BookReview"("status", "createdAt");

-- ===== 3. تحديث User: إضافة حقول NextAuth + 2FA (مشفر) =====
ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT;
ALTER TABLE "User" ADD COLUMN "emailVerified" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "image" TEXT;
-- ملاحظة: twoFactorSecret مُشفّر بـ AES-256-GCM على مستوى التطبيق (src/lib/crypto.ts)
-- مفتاح التشفير: TOTP_ENCRYPTION_KEY (env var, 32 bytes hex)
ALTER TABLE "User" ADD COLUMN "twoFactorSecret" TEXT; -- encrypted AES-256-GCM
ALTER TABLE "User" ADD COLUMN "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "lastLoginAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "lastLoginIp" TEXT;

-- ===== 4. تحديث Book: إضافة status (enum) + تحويل isPublished إلى GENERATED COLUMN =====
-- (إصلاح #5 + ثغرة source-of-truth: مصدر واحد للحقيقة)
CREATE TYPE "BookStatus" AS ENUM ('draft', 'published', 'archived');
ALTER TABLE "Book" ADD COLUMN "status" "BookStatus" NOT NULL DEFAULT 'draft';

-- مزامنة status مع isPublished للبيانات الموجودة (قبل حذف isPublished القديم)
UPDATE "Book" SET "status" = 'published' WHERE "isPublished" = true;
UPDATE "Book" SET "status" = 'draft' WHERE "isPublished" = false;

-- حذف isPublished القديم ثم إعادة إنشائه كـ GENERATED COLUMN
-- isPublished يُحسب تلقائيًا من status = لا فساد صامت للبيانات
ALTER TABLE "Book" DROP COLUMN IF EXISTS "isPublished";
ALTER TABLE "Book" ADD COLUMN "isPublished" BOOLEAN
  GENERATED ALWAYS AS (status = 'published') STORED;

-- فهرس على status (بديل عن isPublished index المحذوف)
CREATE INDEX IF NOT EXISTS "Book_status_idx" ON "Book"("status");

-- ===== 5. Enums =====
CREATE TYPE "AuditSeverity" AS ENUM ('info', 'warning', 'critical');
CREATE TYPE "ContactStatus" AS ENUM ('new', 'read', 'replied', 'converted', 'rejected');

-- ===== 6. جدول Tag (جديد) =====
CREATE TABLE "Tag" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");
CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag"("slug");
CREATE INDEX "Tag_name_idx" ON "Tag"("name");

-- ===== 7. جدول BookTag (جديد — مفتاح مركّب @@id) =====
CREATE TABLE "BookTag" (
    "bookId" INTEGER NOT NULL,
    "tagId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookTag_pkey" PRIMARY KEY ("bookId", "tagId")
);

CREATE INDEX "BookTag_tagId_idx" ON "BookTag"("tagId");

ALTER TABLE "BookTag"
    ADD CONSTRAINT "BookTag_bookId_fkey"
    FOREIGN KEY ("bookId") REFERENCES "Book"("id")
    ON DELETE CASCADE;

ALTER TABLE "BookTag"
    ADD CONSTRAINT "BookTag_tagId_fkey"
    FOREIGN KEY ("tagId") REFERENCES "Tag"("id")
    ON DELETE CASCADE;

-- ===== 8. جدول AuditLog (جديد — severity as enum) =====
CREATE TABLE "AuditLog" (
    "id" SERIAL NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "changes" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "severity" "AuditSeverity" NOT NULL DEFAULT 'info',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
CREATE INDEX "AuditLog_severity_createdAt_idx" ON "AuditLog"("severity", "createdAt");
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");

ALTER TABLE "AuditLog"
    ADD CONSTRAINT "AuditLog_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE SET NULL;

-- ===== 9. جدول Role (جديد) =====
CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "permissions" JSONB NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");
CREATE INDEX "Role_name_idx" ON "Role"("name");

-- إدراج الأدوار الافتراضية (isSystem=true لمنع الحذف)
INSERT INTO "Role" ("name", "displayName", "description", "permissions", "isSystem") VALUES
('reader', 'قارئ', 'مستخدم عادي يتصفح المكتبة',
 '["library.browse","books.download","reviews.create","bookmarks.create"]', true),
('assistant', 'مساعد', 'يساعد في رفع المحتوى',
 '["library.browse","books.download","reviews.create","bookmarks.create","books.upload"]', true),
('librarian', 'أمين مكتبة', 'يدير المحتوى بالكامل',
 '["library.browse","books.download","reviews.create","bookmarks.create","books.upload","books.create","books.update","books.publish","categories.manage","reviews.moderate"]', true),
('admin', 'مدير', 'صلاحيات كاملة', '["*"]', true);

-- ===== 10. جدول UserRole (جديد — مفتاح مركّب) =====
CREATE TABLE "UserRole" (
    "userId" TEXT NOT NULL,
    "roleId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("userId", "roleId")
);

CREATE INDEX "UserRole_roleId_idx" ON "UserRole"("roleId");

ALTER TABLE "UserRole"
    ADD CONSTRAINT "UserRole_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE;

ALTER TABLE "UserRole"
    ADD CONSTRAINT "UserRole_roleId_fkey"
    FOREIGN KEY ("roleId") REFERENCES "Role"("id")
    ON DELETE CASCADE;

-- ===== 11. جدول BookVersion (جديد — مع partial unique index) =====
CREATE TABLE "BookVersion" (
    "id" SERIAL NOT NULL,
    "bookId" INTEGER NOT NULL,
    "version" INTEGER NOT NULL,
    "pdfUrl" TEXT NOT NULL,
    "pdfFileName" TEXT NOT NULL,
    "pdfSize" INTEGER NOT NULL,
    "pdfPageCount" INTEGER NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,

    CONSTRAINT "BookVersion_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BookVersion_bookId_version_idx" ON "BookVersion"("bookId", "version");
CREATE UNIQUE INDEX "BookVersion_bookId_version_key" ON "BookVersion"("bookId", "version");

-- قيد فريد جزئي: إصدار نشط واحد فقط لكل كتاب (WHERE isActive = true)
-- هذا قيد على مستوى PostgreSQL، Prisma لا يدعمه أصليًا
CREATE UNIQUE INDEX "BookVersion_bookId_isActive_key"
    ON "BookVersion"("bookId")
    WHERE "isActive" = true;

ALTER TABLE "BookVersion"
    ADD CONSTRAINT "BookVersion_bookId_fkey"
    FOREIGN KEY ("bookId") REFERENCES "Book"("id")
    ON DELETE CASCADE;

ALTER TABLE "BookVersion"
    ADD CONSTRAINT "BookVersion_uploadedBy_fkey"
    FOREIGN KEY ("uploadedBy") REFERENCES "User"("id");

-- ===== 12. جدول ContactMessage (جديد — مع علاقة Book) =====
-- (إصلاح #1: أضفنا convertedBook كعلاقة فعلية، وليس scalar فقط)
CREATE TABLE "ContactMessage" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "bookTitle" TEXT,
    "message" TEXT NOT NULL,
    "fileUrl" TEXT,
    "status" "ContactStatus" NOT NULL DEFAULT 'new',
    "reply" TEXT,
    "repliedBy" TEXT,
    "repliedAt" TIMESTAMP(3),
    "convertedBookId" INTEGER, -- FK to Book (was scalar before fix #1)
    "convertedAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ContactMessage_status_createdAt_idx" ON "ContactMessage"("status", "createdAt");
CREATE INDEX "ContactMessage_email_idx" ON "ContactMessage"("email");

-- علاقة مع User (الأدمن الذي ردّ)
ALTER TABLE "ContactMessage"
    ADD CONSTRAINT "ContactMessage_repliedBy_fkey"
    FOREIGN KEY ("repliedBy") REFERENCES "User"("id")
    ON DELETE SET NULL;

-- (إصلاح #1) علاقة مع Book — FK حقيقي مع cascade set null
-- عند حذف كتاب، تصبح convertedBookId = null تلقائيًا (لا orphan reference)
ALTER TABLE "ContactMessage"
    ADD CONSTRAINT "ContactMessage_convertedBookId_fkey"
    FOREIGN KEY ("convertedBookId") REFERENCES "Book"("id")
    ON DELETE SET NULL;
