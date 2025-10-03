/*
  Warnings:

  - A unique constraint covering the columns `[externalRef]` on the table `Transaction` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Transaction" ADD COLUMN     "externalRef" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_externalRef_key" ON "public"."Transaction"("externalRef");
