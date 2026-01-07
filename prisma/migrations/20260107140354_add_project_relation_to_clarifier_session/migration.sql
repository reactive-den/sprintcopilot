/*
  Warnings:

  - Added the required column `projectId` to the `ClarifierSession` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ClarifierSession" ADD COLUMN     "projectId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "ClarifierSession_projectId_idx" ON "ClarifierSession"("projectId");
