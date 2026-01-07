-- CreateTable
CREATE TABLE "HDDDocument" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HDDDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HDDDocument_sessionId_section_key" ON "HDDDocument"("sessionId", "section");

-- CreateIndex
CREATE INDEX "HDDDocument_sessionId_idx" ON "HDDDocument"("sessionId");

-- CreateIndex
CREATE INDEX "HDDDocument_projectId_idx" ON "HDDDocument"("projectId");

-- CreateIndex
CREATE INDEX "HDDDocument_section_idx" ON "HDDDocument"("section");

-- AddForeignKey
ALTER TABLE "HDDDocument" ADD CONSTRAINT "HDDDocument_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ClarifierSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HDDDocument" ADD CONSTRAINT "HDDDocument_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
