-- AlterTable: Add projectId column to HDDDocument
ALTER TABLE "HDDDocument" ADD COLUMN IF NOT EXISTS "projectId" TEXT;

-- Update existing rows: Set projectId from ClarifierSession
UPDATE "HDDDocument" h
SET "projectId" = cs."projectId"
FROM "ClarifierSession" cs
WHERE h."sessionId" = cs."id" AND h."projectId" IS NULL;

-- Make projectId NOT NULL after populating existing data
ALTER TABLE "HDDDocument" ALTER COLUMN "projectId" SET NOT NULL;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "HDDDocument_projectId_idx" ON "HDDDocument"("projectId");

-- AddForeignKey
ALTER TABLE "HDDDocument" DROP CONSTRAINT IF EXISTS "HDDDocument_projectId_fkey";
ALTER TABLE "HDDDocument" ADD CONSTRAINT "HDDDocument_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
