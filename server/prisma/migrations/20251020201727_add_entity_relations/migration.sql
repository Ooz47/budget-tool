/*
  Warnings:

  - You are about to drop the column `entity` on the `Transaction` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Entity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "aliasOfId" TEXT,
    "categoryId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Entity_aliasOfId_fkey" FOREIGN KEY ("aliasOfId") REFERENCES "Entity" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Entity_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Entity" ("categoryId", "createdAt", "id", "name", "updatedAt") SELECT "categoryId", "createdAt", "id", "name", "updatedAt" FROM "Entity";
DROP TABLE "Entity";
ALTER TABLE "new_Entity" RENAME TO "Entity";
CREATE UNIQUE INDEX "Entity_name_key" ON "Entity"("name");
CREATE TABLE "new_Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bank" TEXT NOT NULL,
    "accountIban" TEXT,
    "dateOperation" DATETIME NOT NULL,
    "dateValeur" DATETIME,
    "label" TEXT NOT NULL,
    "details" TEXT,
    "debit" REAL NOT NULL DEFAULT 0,
    "credit" REAL NOT NULL DEFAULT 0,
    "amount" REAL NOT NULL,
    "yearMonth" TEXT NOT NULL,
    "sourceFile" TEXT NOT NULL,
    "categoryId" TEXT,
    "fingerprint" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "typeOperation" TEXT,
    "entityId" TEXT,
    CONSTRAINT "Transaction_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Transaction" ("accountIban", "amount", "bank", "categoryId", "createdAt", "credit", "dateOperation", "dateValeur", "debit", "details", "fingerprint", "id", "label", "sourceFile", "typeOperation", "updatedAt", "yearMonth") SELECT "accountIban", "amount", "bank", "categoryId", "createdAt", "credit", "dateOperation", "dateValeur", "debit", "details", "fingerprint", "id", "label", "sourceFile", "typeOperation", "updatedAt", "yearMonth" FROM "Transaction";
DROP TABLE "Transaction";
ALTER TABLE "new_Transaction" RENAME TO "Transaction";
CREATE UNIQUE INDEX "Transaction_fingerprint_key" ON "Transaction"("fingerprint");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
