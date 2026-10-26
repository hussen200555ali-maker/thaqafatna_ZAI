-- Migration: Sprint 0 — Security + Metadata + Versions (REVISED)
-- Generated for: thaqafatna_ZAI
-- Date: 2026-10-26
-- Revisions based on senior review:
--   1. AuditSeverity as enum (not String)
--   2. ContactStatus as enum
--   3. Partial unique index on BookVersion (only one isActive=true per book)
--   4. Renamed AuthorContact → ContactMessage with reply/conversion fields
--   5. Old reviews stay as 'pending' (NOT auto-approved)

-- ===== 1. تحديث BookChapter: إضافة order, pageStart, pageEnd, estimatedMinutes =====
ALTER TABLE "BookChapter" ADD COLUMN "order" INTEGER;
ALTER TABLE "BookChapter" ADD COLUMN "pageStart" INTEGER;
ALTER TABLE "BookChapter" ADD COLUMN "pageEnd" INTEGER;
ALTER TABLE "BookChapter" ADD COLUMN "estimatedMinutes" INTEGER;

-- تعبئة order من number (للبيانات الموجودة)
UPDATE "BookChapter" SET "order" = "number" WHERE "order" IS NULL;

-- جعل order NOT NULL بعد التعبئة
ALTER TABLE "BookChapter" ALTER COLUMN "order" SET NOT NULL;

-- فهرس مركّب للترتيب
CREATE INDEX "BookChapter_bookId_order_idx" ON "BookChapter"("bookId", "order");

-- قيد فريد على (bookId, number)
CREATE UNIQUE INDEX "BookChapter_bookId_number_key" ON "BookChapter"("bookId", "number");

-- ===== 2. تحديث BookReview: إضافة status + moderation fields =====
ALTER TABLE "BookReview" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE "BookReview" ADD COLUMN "rejectionReason" TEXT;
ALTER TABLE "BookReview" ADD COLUMN "moderatedBy" TEXT;
ALTER TABLE "BookReview" ADD COLUMN "moderatedAt" TIMESTAMP(3);

-- IMPORTANT: المراجعات القديمة تبقى 'pending' — لا توافق تلقائية
-- سيقوم الأدمن بمراجعتها يدويًا في /admin/reviews
-- هذا يمنع إدخال محتوى محتمل الإساءة من النظام السابق

-- فهارس للفلترة حسب الحالة
CREATE INDEX "BookReview_status_createdAt_idx" ON "BookReview"("status", "createdAt");

-- ===== 3. تحديث User: إضافة حقول NextAuth + 2FA =====
ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT;
ALTER TABLE "User" ADD COLUMN "emailVerified" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "image" TEXT;
ALTER TABLE "User" ADD COLUMN "twoFactorSecret" TEXT;
ALTER TABLE "User" ADD COLUMN "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "lastLoginAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "lastLoginIp" TEXT;

-- ===== 4. Enums جداول (يمنع القيم الشاذة) =====
CREATE TYPE "AuditSeverity" AS ENUM ('info', 'warning', 'critical');
CREATE TYPE "BookStatus" AS ENUM ('draft', 'published', 'archived');
CREATE TYPE "ContactStatus" AS ENUM ('new', 'read', 'replied', 'converted', 'rejected');

-- ===== 5. جدول Tag (جديد) =====
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

-- ===== 6. جدول BookTag (جديد — مفتاح مركّب @@id) =====
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

-- ===== 7. جدول AuditLog (جديد — severity as enum) =====
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

-- ===== 8. جدول Role (جديد) =====
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
('admin', 'مدير', 'صلاحيات كاملة',
 '["*"]', true);

-- ===== 9. جدول UserRole (جديد — مفتاح مركّب) =====
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

-- ===== 10. جدول BookVersion (جديد — مع partial unique index) =====
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

-- ===== 11. جدول ContactMessage (جديد — بديل CTA "ارفع كتابك") =====
-- اسم: ContactMessage (لا AuthorContact — الإسم أدق)
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
    "convertedBookId" INTEGER,
    "convertedAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ContactMessage_status_createdAt_idx" ON "ContactMessage"("status", "createdAt");
CREATE INDEX "ContactMessage_email_idx" ON "ContactMessage"("email");

ALTER TABLE "ContactMessage"
    ADD CONSTRAINT "ContactMessage_repliedBy_fkey"
    FOREIGN KEY ("repliedBy") REFERENCES "User"("id")
    ON DELETE SET NULL;

ALTER TABLE "ContactMessage"
    ADD CONSTRAINT "ContactMessage_convertedBookId_fkey"
    FOREIGN KEY ("convertedBookId") REFERENCES "Book"("id")
    ON DELETE SET NULL;
