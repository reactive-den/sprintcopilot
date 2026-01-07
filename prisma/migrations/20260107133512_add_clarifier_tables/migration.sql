-- DropForeignKey
ALTER TABLE "public"."ApiUsage" DROP CONSTRAINT "ApiUsage_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Project" DROP CONSTRAINT "Project_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Run" DROP CONSTRAINT "Run_projectId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Ticket" DROP CONSTRAINT "Ticket_runId_fkey";

-- CreateTable
CREATE TABLE "ClarifierSession" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "status" TEXT NOT NULL,
    "idea" TEXT NOT NULL,
    "context" TEXT,
    "constraints" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClarifierSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClarifierMessage" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClarifierMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BddDocument" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "tenantId" TEXT,
    "contentJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BddDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClarifierSession_tenantId_idx" ON "ClarifierSession"("tenantId");

-- CreateIndex
CREATE INDEX "ClarifierSession_status_idx" ON "ClarifierSession"("status");

-- CreateIndex
CREATE INDEX "ClarifierMessage_sessionId_idx" ON "ClarifierMessage"("sessionId");

-- CreateIndex
CREATE INDEX "BddDocument_sessionId_idx" ON "BddDocument"("sessionId");

-- CreateIndex
CREATE INDEX "BddDocument_tenantId_idx" ON "BddDocument"("tenantId");
