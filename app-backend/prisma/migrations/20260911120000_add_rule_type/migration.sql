-- CreateEnum
CREATE TYPE "RuleType" AS ENUM ('STANDARD', 'AUTO_APPROVE');

-- AlterTable
ALTER TABLE "rules" ADD COLUMN "rule_type" "RuleType" NOT NULL DEFAULT 'STANDARD';
