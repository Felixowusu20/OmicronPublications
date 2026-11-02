-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('AUTHOR', 'REVIEWER', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'TECHNICAL_CHECK', 'UNDER_REVIEW', 'MAJOR_REVISION', 'MINOR_REVISION', 'ACCEPTED', 'REJECTED', 'IN_PRODUCTION', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "ReviewType" AS ENUM ('SINGLE_BLIND', 'DOUBLE_BLIND', 'OPEN_REVIEW');

-- CreateEnum
CREATE TYPE "ApcPaymentStatus" AS ENUM ('NOT_REQUIRED', 'PENDING', 'REPORTED', 'PAID', 'WAIVED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'AUTHOR',
    "institution" TEXT,
    "orcid" TEXT,
    "researchInterests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HeroSlide" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "imagePublicId" TEXT,
    "alt" TEXT,
    "ctaLabel" TEXT,
    "ctaHref" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HeroSlide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchSpotlight" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "logoUrl" TEXT,
    "logoPublicId" TEXT,
    "imageUrl" TEXT,
    "imagePublicId" TEXT,
    "articleId" TEXT,
    "externalHref" TEXT,
    "ctaLabel" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResearchSpotlight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "href" TEXT,
    "imageUrl" TEXT,
    "imagePublicId" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Journal" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "shortTitle" TEXT NOT NULL,
    "issn" TEXT,
    "eIssn" TEXT,
    "doiPrefix" TEXT,
    "frequency" TEXT,
    "reviewType" "ReviewType" NOT NULL DEFAULT 'DOUBLE_BLIND',
    "description" TEXT NOT NULL,
    "aims" TEXT,
    "subjects" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "impactFactor" TEXT,
    "acceptanceRate" TEXT,
    "avgReviewDays" INTEGER,
    "openAccess" BOOLEAN NOT NULL DEFAULT true,
    "apc" TEXT,
    "editorInChief" TEXT,
    "coverColor" TEXT NOT NULL DEFAULT '#0B3A53',
    "coverImageUrl" TEXT,
    "coverImagePublicId" TEXT,
    "indexedIn" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "foundedYear" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Journal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublishedArticle" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "doi" TEXT,
    "title" TEXT NOT NULL,
    "authors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "affiliations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "journalId" TEXT NOT NULL,
    "submissionId" TEXT,
    "trashedSubmissionId" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receivedAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "volume" TEXT,
    "issue" TEXT,
    "pages" TEXT,
    "articleType" TEXT NOT NULL,
    "openAccess" BOOLEAN NOT NULL DEFAULT true,
    "license" TEXT,
    "abstract" TEXT NOT NULL,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "coverImageUrl" TEXT,
    "coverImagePublicId" TEXT,
    "manuscriptUrl" TEXT,
    "citations" INTEGER NOT NULL DEFAULT 0,
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "views" INTEGER NOT NULL DEFAULT 0,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublishedArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "manuscriptId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "abstract" TEXT NOT NULL,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "articleType" TEXT NOT NULL,
    "journalId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "reviewerId" TEXT,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'SUBMITTED',
    "progress" INTEGER NOT NULL DEFAULT 20,
    "coverLetter" TEXT,
    "funding" TEXT,
    "conflictOfInterest" TEXT,
    "ethicsStatement" TEXT,
    "manuscriptUrl" TEXT,
    "manuscriptPublicId" TEXT,
    "manuscriptFileName" TEXT,
    "responseFileUrl" TEXT,
    "responseFilePublicId" TEXT,
    "responseFileName" TEXT,
    "responseFileBytes" INTEGER,
    "productionBody" TEXT,
    "productionFigures" JSONB,
    "manuscriptReadyAt" TIMESTAMP(3),
    "actionRequired" TEXT,
    "authorsJson" JSONB,
    "apcPaymentStatus" "ApcPaymentStatus" NOT NULL DEFAULT 'NOT_REQUIRED',
    "apcPaidAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "internalAmount" INTEGER,
    "internalCurrency" TEXT DEFAULT 'GHS',
    "exchangeRate" DOUBLE PRECISION,
    "status" "ApcPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paystackReference" TEXT,
    "paystackAccessCode" TEXT,
    "customerEmail" TEXT,
    "receiptUrl" TEXT,
    "reportedAt" TIMESTAMP(3),
    "proofUrl" TEXT,
    "proofPublicId" TEXT,
    "proofFileName" TEXT,
    "paidAt" TIMESTAMP(3),
    "waivedAt" TIMESTAMP(3),
    "waivedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewFeedback" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "status" "SubmissionStatus" NOT NULL,
    "message" TEXT NOT NULL DEFAULT '',
    "privateNotes" TEXT,
    "fileUrl" TEXT,
    "filePublicId" TEXT,
    "fileName" TEXT,
    "fileBytes" INTEGER,
    "fileResourceType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "submissionId" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "unread" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CmsPage" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "body" TEXT NOT NULL,
    "heroImageUrl" TEXT,
    "heroImagePublicId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CmsPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CmsPageImage" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "imagePublicId" TEXT,
    "caption" TEXT,
    "alt" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CmsPageImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FaqItem" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FaqItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomeGoalTab" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "story" TEXT,
    "imageUrl" TEXT NOT NULL,
    "imagePublicId" TEXT,
    "imageAlt" TEXT,
    "imageCaption" TEXT,
    "links" JSONB NOT NULL DEFAULT '[]',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeGoalTab_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndexedPlatform" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "blurb" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "logoUrl" TEXT NOT NULL,
    "logoPublicId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IndexedPlatform_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomeSection" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "eyebrow" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoiSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "prefix" TEXT NOT NULL DEFAULT 'oid',
    "label" TEXT NOT NULL DEFAULT 'Omicron Identifier (OID)',
    "publisherName" TEXT NOT NULL DEFAULT 'Omicron Publications',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DoiSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- CreateIndex
CREATE INDEX "PasswordResetToken_expiresAt_idx" ON "PasswordResetToken"("expiresAt");

-- CreateIndex
CREATE INDEX "HeroSlide_sortOrder_idx" ON "HeroSlide"("sortOrder");

-- CreateIndex
CREATE INDEX "ResearchSpotlight_sortOrder_idx" ON "ResearchSpotlight"("sortOrder");

-- CreateIndex
CREATE INDEX "ResearchSpotlight_isActive_idx" ON "ResearchSpotlight"("isActive");

-- CreateIndex
CREATE INDEX "ResearchSpotlight_articleId_idx" ON "ResearchSpotlight"("articleId");

-- CreateIndex
CREATE INDEX "Announcement_publishedAt_idx" ON "Announcement"("publishedAt");

-- CreateIndex
CREATE INDEX "Announcement_isActive_idx" ON "Announcement"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Journal_slug_key" ON "Journal"("slug");

-- CreateIndex
CREATE INDEX "Journal_slug_idx" ON "Journal"("slug");

-- CreateIndex
CREATE INDEX "Journal_sortOrder_idx" ON "Journal"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "PublishedArticle_slug_key" ON "PublishedArticle"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "PublishedArticle_submissionId_key" ON "PublishedArticle"("submissionId");

-- CreateIndex
CREATE INDEX "PublishedArticle_publishedAt_idx" ON "PublishedArticle"("publishedAt");

-- CreateIndex
CREATE INDEX "PublishedArticle_journalId_idx" ON "PublishedArticle"("journalId");

-- CreateIndex
CREATE INDEX "PublishedArticle_isFeatured_idx" ON "PublishedArticle"("isFeatured");

-- CreateIndex
CREATE INDEX "PublishedArticle_deletedAt_idx" ON "PublishedArticle"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Submission_manuscriptId_key" ON "Submission"("manuscriptId");

-- CreateIndex
CREATE INDEX "Submission_authorId_idx" ON "Submission"("authorId");

-- CreateIndex
CREATE INDEX "Submission_reviewerId_idx" ON "Submission"("reviewerId");

-- CreateIndex
CREATE INDEX "Submission_status_idx" ON "Submission"("status");

-- CreateIndex
CREATE INDEX "Submission_journalId_idx" ON "Submission"("journalId");

-- CreateIndex
CREATE INDEX "Submission_apcPaymentStatus_idx" ON "Submission"("apcPaymentStatus");

-- CreateIndex
CREATE INDEX "Submission_deletedAt_idx" ON "Submission"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_submissionId_key" ON "Payment"("submissionId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_paystackReference_key" ON "Payment"("paystackReference");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Payment_paystackReference_idx" ON "Payment"("paystackReference");

-- CreateIndex
CREATE INDEX "Payment_reportedAt_idx" ON "Payment"("reportedAt");

-- CreateIndex
CREATE INDEX "ReviewFeedback_submissionId_idx" ON "ReviewFeedback"("submissionId");

-- CreateIndex
CREATE INDEX "ReviewFeedback_reviewerId_idx" ON "ReviewFeedback"("reviewerId");

-- CreateIndex
CREATE INDEX "Notification_userId_unread_idx" ON "Notification"("userId", "unread");

-- CreateIndex
CREATE UNIQUE INDEX "CmsPage_slug_key" ON "CmsPage"("slug");

-- CreateIndex
CREATE INDEX "CmsPage_slug_idx" ON "CmsPage"("slug");

-- CreateIndex
CREATE INDEX "CmsPageImage_pageId_sortOrder_idx" ON "CmsPageImage"("pageId", "sortOrder");

-- CreateIndex
CREATE INDEX "FaqItem_sortOrder_idx" ON "FaqItem"("sortOrder");

-- CreateIndex
CREATE INDEX "FaqItem_isActive_idx" ON "FaqItem"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "HomeGoalTab_key_key" ON "HomeGoalTab"("key");

-- CreateIndex
CREATE INDEX "HomeGoalTab_sortOrder_idx" ON "HomeGoalTab"("sortOrder");

-- CreateIndex
CREATE INDEX "HomeGoalTab_isActive_idx" ON "HomeGoalTab"("isActive");

-- CreateIndex
CREATE INDEX "IndexedPlatform_sortOrder_idx" ON "IndexedPlatform"("sortOrder");

-- CreateIndex
CREATE INDEX "IndexedPlatform_isActive_idx" ON "IndexedPlatform"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "HomeSection_key_key" ON "HomeSection"("key");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchSpotlight" ADD CONSTRAINT "ResearchSpotlight_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "PublishedArticle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublishedArticle" ADD CONSTRAINT "PublishedArticle_journalId_fkey" FOREIGN KEY ("journalId") REFERENCES "Journal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublishedArticle" ADD CONSTRAINT "PublishedArticle_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_journalId_fkey" FOREIGN KEY ("journalId") REFERENCES "Journal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewFeedback" ADD CONSTRAINT "ReviewFeedback_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewFeedback" ADD CONSTRAINT "ReviewFeedback_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CmsPageImage" ADD CONSTRAINT "CmsPageImage_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "CmsPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
