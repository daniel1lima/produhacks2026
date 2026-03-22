-- AlterTable
ALTER TABLE "Analysis" ADD COLUMN     "appearanceScore" INTEGER,
ADD COLUMN     "visualConcerns" JSONB,
ADD COLUMN     "visualSummary" TEXT;
