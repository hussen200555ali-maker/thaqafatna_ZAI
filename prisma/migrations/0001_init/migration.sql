-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Chapter" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "icon" TEXT NOT NULL DEFAULT '⭐',
    "color" TEXT NOT NULL DEFAULT 'oklch(0.78 0.13 80)',
    "order" INTEGER NOT NULL DEFAULT 0,
    "unlockAt" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chapter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Level" (
    "id" SERIAL NOT NULL,
    "chapterId" INTEGER NOT NULL,
    "number" INTEGER NOT NULL DEFAULT 1,
    "title" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'easy',
    "gameMode" TEXT NOT NULL DEFAULT 'quiz',
    "puzzleType" TEXT NOT NULL DEFAULT 'text',
    "timeLimit" INTEGER NOT NULL DEFAULT 0,
    "gridSizeRows" INTEGER NOT NULL DEFAULT 5,
    "gridSizeCols" INTEGER NOT NULL DEFAULT 5,
    "availableLetters" TEXT NOT NULL,
    "bonusWords" TEXT NOT NULL DEFAULT '',
    "reward" INTEGER NOT NULL DEFAULT 50,
    "hintCost" INTEGER NOT NULL DEFAULT 10,
    "learningGoals" TEXT NOT NULL DEFAULT '[]',
    "educationalDescription" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "version" INTEGER NOT NULL DEFAULT 1,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Level_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Word" (
    "id" SERIAL NOT NULL,
    "levelId" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "clue" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT '',
    "imageUrl" TEXT NOT NULL DEFAULT '',
    "image2Url" TEXT NOT NULL DEFAULT '',
    "image3Url" TEXT NOT NULL DEFAULT '',
    "image4Url" TEXT NOT NULL DEFAULT '',
    "emojis" TEXT NOT NULL DEFAULT '',
    "options" TEXT NOT NULL DEFAULT '',
    "correctOption" INTEGER NOT NULL DEFAULT 0,
    "matchPairs" TEXT NOT NULL DEFAULT '',
    "fillBlanks" TEXT NOT NULL DEFAULT '',
    "audioUrl" TEXT NOT NULL DEFAULT '',
    "logicData" TEXT NOT NULL DEFAULT '',
    "sequence" TEXT NOT NULL DEFAULT '',
    "direction" TEXT NOT NULL DEFAULT 'across',
    "startRow" INTEGER NOT NULL DEFAULT 0,
    "startCol" INTEGER NOT NULL DEFAULT 0,
    "number" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Word_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cell" (
    "id" SERIAL NOT NULL,
    "levelId" INTEGER NOT NULL,
    "row" INTEGER NOT NULL,
    "col" INTEGER NOT NULL,
    "letter" TEXT NOT NULL,
    "number" INTEGER,

    CONSTRAINT "Cell_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'player',
    "coins" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerProgress" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "levelId" INTEGER NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "stars" INTEGER NOT NULL DEFAULT 0,
    "score" INTEGER NOT NULL DEFAULT 0,
    "hintsUsed" INTEGER NOT NULL DEFAULT 0,
    "timeSpent" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "PlayerProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyChallenge" (
    "id" SERIAL NOT NULL,
    "date" TEXT NOT NULL,
    "levelId" INTEGER NOT NULL,
    "bonusReward" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserStreak" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "lastChallengeDate" TEXT,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserStreak_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "icon" TEXT NOT NULL DEFAULT '🎯',
    "category" TEXT NOT NULL DEFAULT 'vocabulary',
    "level" INTEGER NOT NULL DEFAULT 1,
    "isRoot" BOOLEAN NOT NULL DEFAULT false,
    "parentId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LevelSkill" (
    "id" SERIAL NOT NULL,
    "levelId" INTEGER NOT NULL,
    "skillId" INTEGER NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 5,

    CONSTRAINT "LevelSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerSkill" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "skillId" INTEGER NOT NULL,
    "mastery" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "correct" INTEGER NOT NULL DEFAULT 0,
    "incorrect" INTEGER NOT NULL DEFAULT 0,
    "hintsUsed" INTEGER NOT NULL DEFAULT 0,
    "avgTimeSec" INTEGER NOT NULL DEFAULT 0,
    "lastPracticedAt" TIMESTAMP(3),
    "masteredAt" TIMESTAMP(3),

    CONSTRAINT "PlayerSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdaptiveState" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "playerLevel" INTEGER NOT NULL DEFAULT 1,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "difficultyMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "strengths" TEXT NOT NULL DEFAULT '[]',
    "weaknesses" TEXT NOT NULL DEFAULT '[]',
    "recommendedLevelId" INTEGER,
    "recommendationReason" TEXT NOT NULL DEFAULT '',
    "recommendationType" TEXT NOT NULL DEFAULT 'next',
    "lastMapUpdate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdaptiveState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningEvent" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "context" TEXT NOT NULL DEFAULT '{}',
    "value" INTEGER NOT NULL DEFAULT 0,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionTypeStat" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "puzzleType" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "correct" INTEGER NOT NULL DEFAULT 0,
    "avgTimeSec" INTEGER NOT NULL DEFAULT 0,
    "lastPlayedAt" TIMESTAMP(3),

    CONSTRAINT "QuestionTypeStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookCategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT '📚',
    "color" TEXT NOT NULL DEFAULT '#3b82f6',
    "description" TEXT NOT NULL DEFAULT '',
    "order" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Book" (
    "id" SERIAL NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "coverImage" TEXT NOT NULL DEFAULT '',
    "contentType" TEXT NOT NULL DEFAULT 'text',
    "pdfUrl" TEXT NOT NULL DEFAULT '',
    "audioUrl" TEXT NOT NULL DEFAULT '',
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "readingTimeMin" INTEGER NOT NULL DEFAULT 15,
    "pages" INTEGER NOT NULL DEFAULT 0,
    "language" TEXT NOT NULL DEFAULT 'ar',
    "isbn" TEXT,
    "keywords" TEXT NOT NULL DEFAULT '[]',
    "views" INTEGER NOT NULL DEFAULT 0,
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "ratingAvg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "relatedLevels" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Book_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookChapter" (
    "id" SERIAL NOT NULL,
    "bookId" INTEGER NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "readingTimeMin" INTEGER NOT NULL DEFAULT 5,
    "isFree" BOOLEAN NOT NULL DEFAULT true,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "keywords" TEXT NOT NULL DEFAULT '[]',
    "relatedLevelId" INTEGER,

    CONSTRAINT "BookChapter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBookmark" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "bookId" INTEGER NOT NULL,
    "chapterId" INTEGER,
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBookmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookReview" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "bookId" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "review" TEXT NOT NULL DEFAULT '',
    "likes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserReadingProgress" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "bookId" INTEGER NOT NULL,
    "currentChapter" INTEGER NOT NULL DEFAULT 1,
    "currentScroll" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "timeSpentSec" INTEGER NOT NULL DEFAULT 0,
    "completedChapters" TEXT NOT NULL DEFAULT '[]',
    "completedAt" TIMESTAMP(3),
    "lastReadAt" TIMESTAMP(3),

    CONSTRAINT "UserReadingProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCertificate" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "bookId" INTEGER NOT NULL,
    "certificateNumber" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserCertificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserWordMastery" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "wordText" TEXT NOT NULL,
    "clue" TEXT NOT NULL DEFAULT '',
    "easeFactor" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "interval" INTEGER NOT NULL DEFAULT 1,
    "repetitions" INTEGER NOT NULL DEFAULT 0,
    "nextReviewAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReviewedAt" TIMESTAMP(3),
    "sourceType" TEXT NOT NULL DEFAULT 'level',
    "sourceId" INTEGER,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "wrongCount" INTEGER NOT NULL DEFAULT 0,
    "lastQuality" INTEGER,

    CONSTRAINT "UserWordMastery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewLog" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "quality" INTEGER NOT NULL,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Level_chapterId_idx" ON "Level"("chapterId");

-- CreateIndex
CREATE INDEX "Level_status_idx" ON "Level"("status");

-- CreateIndex
CREATE INDEX "Word_levelId_idx" ON "Word"("levelId");

-- CreateIndex
CREATE INDEX "Cell_levelId_idx" ON "Cell"("levelId");

-- CreateIndex
CREATE UNIQUE INDEX "Cell_levelId_row_col_key" ON "Cell"("levelId", "row", "col");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "PlayerProgress_userId_idx" ON "PlayerProgress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerProgress_userId_levelId_key" ON "PlayerProgress"("userId", "levelId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyChallenge_date_key" ON "DailyChallenge"("date");

-- CreateIndex
CREATE UNIQUE INDEX "UserStreak_userId_key" ON "UserStreak"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_code_key" ON "Skill"("code");

-- CreateIndex
CREATE INDEX "Skill_parentId_idx" ON "Skill"("parentId");

-- CreateIndex
CREATE INDEX "Skill_category_idx" ON "Skill"("category");

-- CreateIndex
CREATE INDEX "LevelSkill_skillId_idx" ON "LevelSkill"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "LevelSkill_levelId_skillId_key" ON "LevelSkill"("levelId", "skillId");

-- CreateIndex
CREATE INDEX "PlayerSkill_userId_idx" ON "PlayerSkill"("userId");

-- CreateIndex
CREATE INDEX "PlayerSkill_skillId_idx" ON "PlayerSkill"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerSkill_userId_skillId_key" ON "PlayerSkill"("userId", "skillId");

-- CreateIndex
CREATE UNIQUE INDEX "AdaptiveState_userId_key" ON "AdaptiveState"("userId");

-- CreateIndex
CREATE INDEX "LearningEvent_userId_eventType_idx" ON "LearningEvent"("userId", "eventType");

-- CreateIndex
CREATE INDEX "LearningEvent_userId_timestamp_idx" ON "LearningEvent"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "LearningEvent_timestamp_idx" ON "LearningEvent"("timestamp");

-- CreateIndex
CREATE INDEX "QuestionTypeStat_userId_idx" ON "QuestionTypeStat"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionTypeStat_userId_puzzleType_key" ON "QuestionTypeStat"("userId", "puzzleType");

-- CreateIndex
CREATE UNIQUE INDEX "BookCategory_name_key" ON "BookCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "BookCategory_slug_key" ON "BookCategory"("slug");

-- CreateIndex
CREATE INDEX "BookCategory_isPublished_idx" ON "BookCategory"("isPublished");

-- CreateIndex
CREATE UNIQUE INDEX "Book_isbn_key" ON "Book"("isbn");

-- CreateIndex
CREATE INDEX "Book_categoryId_idx" ON "Book"("categoryId");

-- CreateIndex
CREATE INDEX "Book_isPublished_idx" ON "Book"("isPublished");

-- CreateIndex
CREATE INDEX "Book_isFeatured_idx" ON "Book"("isFeatured");

-- CreateIndex
CREATE INDEX "BookChapter_bookId_idx" ON "BookChapter"("bookId");

-- CreateIndex
CREATE INDEX "UserBookmark_userId_idx" ON "UserBookmark"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserBookmark_userId_bookId_chapterId_key" ON "UserBookmark"("userId", "bookId", "chapterId");

-- CreateIndex
CREATE INDEX "BookReview_bookId_idx" ON "BookReview"("bookId");

-- CreateIndex
CREATE UNIQUE INDEX "BookReview_userId_bookId_key" ON "BookReview"("userId", "bookId");

-- CreateIndex
CREATE INDEX "UserReadingProgress_userId_idx" ON "UserReadingProgress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserReadingProgress_userId_bookId_key" ON "UserReadingProgress"("userId", "bookId");

-- CreateIndex
CREATE UNIQUE INDEX "UserCertificate_certificateNumber_key" ON "UserCertificate"("certificateNumber");

-- CreateIndex
CREATE INDEX "UserCertificate_userId_idx" ON "UserCertificate"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserCertificate_userId_bookId_key" ON "UserCertificate"("userId", "bookId");

-- CreateIndex
CREATE INDEX "UserWordMastery_userId_nextReviewAt_idx" ON "UserWordMastery"("userId", "nextReviewAt");

-- CreateIndex
CREATE INDEX "UserWordMastery_userId_idx" ON "UserWordMastery"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserWordMastery_userId_word_key" ON "UserWordMastery"("userId", "word");

-- CreateIndex
CREATE INDEX "ReviewLog_userId_reviewedAt_idx" ON "ReviewLog"("userId", "reviewedAt");

-- CreateIndex
CREATE INDEX "ReviewLog_word_idx" ON "ReviewLog"("word");

-- AddForeignKey
ALTER TABLE "Level" ADD CONSTRAINT "Level_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Word" ADD CONSTRAINT "Word_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Level"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cell" ADD CONSTRAINT "Cell_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Level"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerProgress" ADD CONSTRAINT "PlayerProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerProgress" ADD CONSTRAINT "PlayerProgress_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Level"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyChallenge" ADD CONSTRAINT "DailyChallenge_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Level"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserStreak" ADD CONSTRAINT "UserStreak_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Skill" ADD CONSTRAINT "Skill_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Skill"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LevelSkill" ADD CONSTRAINT "LevelSkill_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Level"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LevelSkill" ADD CONSTRAINT "LevelSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerSkill" ADD CONSTRAINT "PlayerSkill_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerSkill" ADD CONSTRAINT "PlayerSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdaptiveState" ADD CONSTRAINT "AdaptiveState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningEvent" ADD CONSTRAINT "LearningEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionTypeStat" ADD CONSTRAINT "QuestionTypeStat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Book" ADD CONSTRAINT "Book_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "BookCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookChapter" ADD CONSTRAINT "BookChapter_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBookmark" ADD CONSTRAINT "UserBookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBookmark" ADD CONSTRAINT "UserBookmark_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookReview" ADD CONSTRAINT "BookReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookReview" ADD CONSTRAINT "BookReview_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserReadingProgress" ADD CONSTRAINT "UserReadingProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserReadingProgress" ADD CONSTRAINT "UserReadingProgress_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCertificate" ADD CONSTRAINT "UserCertificate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCertificate" ADD CONSTRAINT "UserCertificate_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserWordMastery" ADD CONSTRAINT "UserWordMastery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

