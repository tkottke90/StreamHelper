-- CreateTable
CREATE TABLE "StreamDestination" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "streamId" INTEGER NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "platform" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "rtmpUrl" TEXT NOT NULL,
    "streamKey" TEXT NOT NULL,
    "displayName" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" DATETIME,
    CONSTRAINT "StreamDestination_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES "InputStream" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StreamDestination_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "StreamDestination_streamId_idx" ON "StreamDestination"("streamId");

-- CreateIndex
CREATE INDEX "StreamDestination_ownerId_idx" ON "StreamDestination"("ownerId");

-- CreateIndex
CREATE INDEX "StreamDestination_platform_idx" ON "StreamDestination"("platform");
