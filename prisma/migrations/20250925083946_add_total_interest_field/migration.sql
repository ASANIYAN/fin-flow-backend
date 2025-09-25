/*
  Warnings:

  - Added the required column `totalInterest` to the `Loan` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Loan" ADD COLUMN     "totalInterest" DECIMAL(10,2) NOT NULL;
