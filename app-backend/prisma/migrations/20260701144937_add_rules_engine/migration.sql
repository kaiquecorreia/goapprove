-- CreateEnum
CREATE TYPE "RuleStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ApprovalMode" AS ENUM ('ANY', 'ALL', 'SEQUENTIAL');

-- CreateEnum
CREATE TYPE "RuleConflictStrategy" AS ENUM ('HIGHEST_PRIORITY', 'MOST_RESTRICTIVE', 'FIRST_MATCH');

-- CreateEnum
CREATE TYPE "RuleConditionSourceType" AS ENUM ('PO_HEADER', 'PO_LINE', 'PO_ADDITIONAL', 'MANUAL_FIELD');

-- CreateEnum
CREATE TYPE "RuleOperator" AS ENUM ('EQUALS', 'NOT_EQUALS', 'GREATER_THAN', 'GREATER_THAN_OR_EQUAL', 'LESS_THAN', 'LESS_THAN_OR_EQUAL', 'BETWEEN', 'CONTAINS', 'IN_LIST', 'NOT_IN_LIST', 'EXISTS', 'NOT_EXISTS');

-- CreateTable
CREATE TABLE "rules" (
    "rule_id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "company_id" UUID NOT NULL,
    "priority" INTEGER NOT NULL,
    "valid_from" DATE NOT NULL,
    "valid_to" DATE,
    "status" "RuleStatus" NOT NULL DEFAULT 'ACTIVE',
    "conflict_strategy" "RuleConflictStrategy" NOT NULL DEFAULT 'HIGHEST_PRIORITY',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rules_pkey" PRIMARY KEY ("rule_id")
);

-- CreateTable
CREATE TABLE "rule_conditions" (
    "rule_condition_id" UUID NOT NULL,
    "rule_id" UUID NOT NULL,
    "source_type" "RuleConditionSourceType" NOT NULL,
    "field" VARCHAR(100) NOT NULL,
    "operator" "RuleOperator" NOT NULL,
    "value" TEXT,
    "value_to" TEXT,
    "value_list" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rule_conditions_pkey" PRIMARY KEY ("rule_condition_id")
);

-- CreateTable
CREATE TABLE "rule_levels" (
    "rule_level_id" UUID NOT NULL,
    "rule_id" UUID NOT NULL,
    "level_number" INTEGER NOT NULL,
    "mode" "ApprovalMode" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rule_levels_pkey" PRIMARY KEY ("rule_level_id")
);

-- CreateTable
CREATE TABLE "rule_level_approvers" (
    "rule_level_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rule_level_approvers_pkey" PRIMARY KEY ("rule_level_id","user_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rules_code_key" ON "rules"("code");

-- CreateIndex
CREATE INDEX "rules_company_id_status_idx" ON "rules"("company_id", "status");

-- CreateIndex
CREATE INDEX "rules_company_id_priority_idx" ON "rules"("company_id", "priority");

-- CreateIndex
CREATE INDEX "rule_conditions_rule_id_idx" ON "rule_conditions"("rule_id");

-- CreateIndex
CREATE UNIQUE INDEX "rule_levels_rule_id_level_number_key" ON "rule_levels"("rule_id", "level_number");

-- AddForeignKey
ALTER TABLE "rules" ADD CONSTRAINT "rules_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("company_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rule_conditions" ADD CONSTRAINT "rule_conditions_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "rules"("rule_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rule_levels" ADD CONSTRAINT "rule_levels_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "rules"("rule_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rule_level_approvers" ADD CONSTRAINT "rule_level_approvers_rule_level_id_fkey" FOREIGN KEY ("rule_level_id") REFERENCES "rule_levels"("rule_level_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rule_level_approvers" ADD CONSTRAINT "rule_level_approvers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
