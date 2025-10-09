-- Drop the role column from User table
ALTER TABLE "public"."User" DROP COLUMN "role";

-- Drop the Role enum
DROP TYPE "public"."Role";
