-- CreateTable
CREATE TABLE "UserGame" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "gameUUID" TEXT NOT NULL,
    "game" TEXT NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "allowAutoCreateSessions" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserGame_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserGameData" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sessionUUID" TEXT NOT NULL,
    "gameId" INTEGER NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserGameData_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserGameData_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "UserGame" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserGameDataKeys" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "gameId" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "unit" TEXT NOT NULL DEFAULT '',
    "dataType" TEXT NOT NULL DEFAULT '',
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "defaultValue" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserGameDataKeys_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "UserGame" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserStreamAsset" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ownerId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "html" TEXT NOT NULL,
    "css" TEXT NOT NULL,
    "javascript" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserStreamAsset_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_InputStream" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "key" TEXT NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "isLive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" DATETIME,
    CONSTRAINT "InputStream_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_InputStream" ("createdAt", "deletedAt", "id", "isLive", "key", "ownerId", "updatedAt") SELECT "createdAt", "deletedAt", "id", "isLive", "key", "ownerId", "updatedAt" FROM "InputStream";
DROP TABLE "InputStream";
ALTER TABLE "new_InputStream" RENAME TO "InputStream";
CREATE TABLE "new_UserRole" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "value" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_UserRole" ("createdAt", "id", "updatedAt", "userId", "value") SELECT "createdAt", "id", "updatedAt", "userId", "value" FROM "UserRole";
DROP TABLE "UserRole";
ALTER TABLE "new_UserRole" RENAME TO "UserRole";
CREATE UNIQUE INDEX "UserRole_value_key" ON "UserRole"("value");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "UserGame_gameUUID_key" ON "UserGame"("gameUUID");

-- CreateIndex
CREATE INDEX "UserGame_ownerId_idx" ON "UserGame"("ownerId");

-- CreateIndex
CREATE INDEX "UserGame_gameUUID_idx" ON "UserGame"("gameUUID");

-- CreateIndex
CREATE UNIQUE INDEX "UserGameData_sessionUUID_key" ON "UserGameData"("sessionUUID");

-- CreateIndex
CREATE INDEX "UserGameData_ownerId_idx" ON "UserGameData"("ownerId");

-- CreateIndex
CREATE INDEX "UserGameData_gameId_idx" ON "UserGameData"("gameId");

-- CreateIndex
CREATE INDEX "UserGameData_sessionUUID_idx" ON "UserGameData"("sessionUUID");

-- CreateIndex
CREATE UNIQUE INDEX "UserGameDataKeys_key_key" ON "UserGameDataKeys"("key");

-- CreateIndex
CREATE INDEX "UserGameDataKeys_gameId_idx" ON "UserGameDataKeys"("gameId");

-- CreateIndex
CREATE INDEX "UserStreamAsset_ownerId_idx" ON "UserStreamAsset"("ownerId");
