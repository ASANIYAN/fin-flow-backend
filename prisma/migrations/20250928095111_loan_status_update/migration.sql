/*
  Warnings:

  - The values [COMPLETED,CANCELLED] on the enum `LoanStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."LoanStatus_new" AS ENUM ('PENDING', 'FUNDING', 'FUNDED', 'REPAID');
ALTER TABLE "public"."Loan" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."Loan" ALTER COLUMN "status" TYPE "public"."LoanStatus_new" USING ("status"::text::"public"."LoanStatus_new");
ALTER TYPE "public"."LoanStatus" RENAME TO "LoanStatus_old";
ALTER TYPE "public"."LoanStatus_new" RENAME TO "LoanStatus";
DROP TYPE "public"."LoanStatus_old";
ALTER TABLE "public"."Loan" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;
