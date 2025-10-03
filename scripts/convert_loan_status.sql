-- Helper SQL to preview or run the mapping of old Loan.status -> new labels
-- Usage (psql): \i convert_loan_status.sql

BEGIN;

-- Preview mapping (use SELECT to inspect before committing):
SELECT id, status,
  CASE
    WHEN status = 'COMPLETED' THEN 'REPAID'
    WHEN status = 'CANCELLED' THEN 'PENDING'
    ELSE status
  END AS mapped_status
FROM "Loan" LIMIT 50;

-- To actually update into a temporary column (example):
-- ALTER TABLE "Loan" ADD COLUMN status_tmp TEXT;
-- UPDATE "Loan" SET status_tmp = CASE WHEN status = 'COMPLETED' THEN 'REPAID' WHEN status = 'CANCELLED' THEN 'PENDING' ELSE status END;

COMMIT;
