-- AlterTable
ALTER TABLE "UserApiKey" ADD COLUMN "expiresAt" DATETIME;
ALTER TABLE "UserApiKey" ADD COLUMN "lastUsedAt" DATETIME;

-- CreateIndex
CREATE INDEX "UserApiKey_expiresAt_idx" ON "UserApiKey"("expiresAt");
