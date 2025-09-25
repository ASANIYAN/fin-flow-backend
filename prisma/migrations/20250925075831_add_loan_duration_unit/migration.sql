/*
  Warnings:

  - You are about to alter the column `amountRequested` on the `Loan` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `amountFunded` on the `Loan` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `interestRate` on the `Loan` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(5,2)`.

*/
-- CreateEnum
CREATE TYPE "public"."DurationUnit" AS ENUM ('DAYS', 'WEEKS', 'MONTHS', 'YEARS');

-- AlterTable
ALTER TABLE "public"."Loan" ADD COLUMN     "durationUnit" "public"."DurationUnit" NOT NULL DEFAULT 'MONTHS',
ALTER COLUMN "amountRequested" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "amountFunded" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "interestRate" SET DATA TYPE DECIMAL(5,2);
