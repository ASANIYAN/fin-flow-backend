/*
  Warnings:

  - The values [FUNDED] on the enum `LoanStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [FUNDING_DEBIT,FUNDING_CREDIT] on the enum `TransactionType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to alter the column `amount` on the `Transaction` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to drop the column `balance` on the `User` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."LoanStatus_new" AS ENUM ('PENDING', 'FUNDING', 'FULLY_FUNDED', 'ACTIVE', 'REPAID');
ALTER TABLE "public"."Loan" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."Loan" ALTER COLUMN "status" TYPE "public"."LoanStatus_new" USING ("status"::text::"public"."LoanStatus_new");
ALTER TYPE "public"."LoanStatus" RENAME TO "LoanStatus_old";
ALTER TYPE "public"."LoanStatus_new" RENAME TO "LoanStatus";
DROP TYPE "public"."LoanStatus_old";
ALTER TABLE "public"."Loan" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "public"."TransactionType_new" AS ENUM ('DEPOSIT', 'FUNDING_COMMIT', 'FUNDING_RELEASE', 'DISBURSEMENT', 'REPAYMENT', 'WITHDRAWAL');
ALTER TABLE "public"."Transaction" ALTER COLUMN "type" TYPE "public"."TransactionType_new" USING ("type"::text::"public"."TransactionType_new");
ALTER TYPE "public"."TransactionType" RENAME TO "TransactionType_old";
ALTER TYPE "public"."TransactionType_new" RENAME TO "TransactionType";
DROP TYPE "public"."TransactionType_old";
COMMIT;

-- AlterTable
ALTER TABLE "public"."Loan" ADD COLUMN     "principalRepaid" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."Transaction" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "balance",
ADD COLUMN     "availableBalance" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "escrowBalance" DECIMAL(10,2) NOT NULL DEFAULT 0;
