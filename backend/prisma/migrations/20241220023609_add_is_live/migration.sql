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
    CONSTRAINT "InputStream_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_InputStream" ("createdAt", "deletedAt", "id", "key", "ownerId", "updatedAt") SELECT "createdAt", "deletedAt", "id", "key", "ownerId", "updatedAt" FROM "InputStream";
DROP TABLE "InputStream";
ALTER TABLE "new_InputStream" RENAME TO "InputStream";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
