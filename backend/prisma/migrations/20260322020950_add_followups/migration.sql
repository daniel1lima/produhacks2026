-- CreateTable
CREATE TABLE "FollowUp" (
    "id" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "response" TEXT,
    "addressedAt" TIMESTAMP(3),
    "sessionId" TEXT,
    "caretakerId" TEXT NOT NULL DEFAULT 'caretaker-001',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FollowUp_pkey" PRIMARY KEY ("id")
);
