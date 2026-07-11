-- CreateEnum
CREATE TYPE "PurchaseOrderStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'NO_RULE', 'ERROR');

-- CreateEnum
CREATE TYPE "WorkflowStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'NO_RULE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LevelStatus" AS ENUM ('LOCKED', 'PENDING', 'APPROVED', 'REJECTED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "DecisionType" AS ENUM ('APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "LnSyncStatus" AS ENUM ('NOT_APPLICABLE', 'PENDING', 'SYNCED', 'FAILED');

-- AlterTable
ALTER TABLE "purchase_orders" ADD COLUMN     "status" "PurchaseOrderStatus" NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "approval_workflows" (
    "workflow_id" UUID NOT NULL,
    "purchase_order_id" UUID NOT NULL,
    "rule_id" UUID,
    "status" "WorkflowStatus" NOT NULL DEFAULT 'PENDING',
    "current_level" INTEGER,
    "require_comment_on_approve" BOOLEAN NOT NULL DEFAULT false,
    "require_comment_on_reject" BOOLEAN NOT NULL DEFAULT true,
    "on_reject_action" VARCHAR(20) NOT NULL DEFAULT 'HALT',
    "finalized_at" TIMESTAMP(3),
    "ln_sync_status" "LnSyncStatus" NOT NULL DEFAULT 'NOT_APPLICABLE',
    "ln_sync_attempts" INTEGER NOT NULL DEFAULT 0,
    "ln_last_error" TEXT,
    "ln_synced_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "approval_workflows_pkey" PRIMARY KEY ("workflow_id")
);

-- CreateTable
CREATE TABLE "approval_workflow_levels" (
    "level_id" UUID NOT NULL,
    "workflow_id" UUID NOT NULL,
    "level" INTEGER NOT NULL,
    "mode" "ApprovalMode" NOT NULL,
    "status" "LevelStatus" NOT NULL DEFAULT 'LOCKED',
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approval_workflow_levels_pkey" PRIMARY KEY ("level_id")
);

-- CreateTable
CREATE TABLE "approval_workflow_approvers" (
    "level_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "sequence_order" INTEGER NOT NULL DEFAULT 1,
    "status" "LevelStatus" NOT NULL DEFAULT 'PENDING',
    "decided_at" TIMESTAMP(3),

    CONSTRAINT "approval_workflow_approvers_pkey" PRIMARY KEY ("level_id","user_id")
);

-- CreateTable
CREATE TABLE "approval_decisions" (
    "decision_id" UUID NOT NULL,
    "level_id" UUID NOT NULL,
    "assigned_user_id" UUID NOT NULL,
    "acting_user_id" UUID NOT NULL,
    "decision" "DecisionType" NOT NULL,
    "comment" TEXT,
    "decided_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approval_decisions_pkey" PRIMARY KEY ("decision_id")
);

-- CreateTable
CREATE TABLE "workflow_audit_events" (
    "event_id" UUID NOT NULL,
    "workflow_id" UUID NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "severity" VARCHAR(20) NOT NULL,
    "actor_user_id" UUID,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_audit_events_pkey" PRIMARY KEY ("event_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "approval_workflows_purchase_order_id_key" ON "approval_workflows"("purchase_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "approval_workflow_levels_workflow_id_level_key" ON "approval_workflow_levels"("workflow_id", "level");

-- CreateIndex
CREATE UNIQUE INDEX "approval_workflow_approvers_level_id_sequence_order_key" ON "approval_workflow_approvers"("level_id", "sequence_order");

-- CreateIndex
CREATE INDEX "workflow_audit_events_workflow_id_created_at_idx" ON "workflow_audit_events"("workflow_id", "created_at");

-- AddForeignKey
ALTER TABLE "approval_workflows" ADD CONSTRAINT "approval_workflows_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("purchase_order_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_workflows" ADD CONSTRAINT "approval_workflows_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "rules"("rule_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_workflow_levels" ADD CONSTRAINT "approval_workflow_levels_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "approval_workflows"("workflow_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_workflow_approvers" ADD CONSTRAINT "approval_workflow_approvers_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "approval_workflow_levels"("level_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_workflow_approvers" ADD CONSTRAINT "approval_workflow_approvers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_decisions" ADD CONSTRAINT "approval_decisions_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "approval_workflow_levels"("level_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_decisions" ADD CONSTRAINT "approval_decisions_assigned_user_id_fkey" FOREIGN KEY ("assigned_user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_decisions" ADD CONSTRAINT "approval_decisions_acting_user_id_fkey" FOREIGN KEY ("acting_user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_audit_events" ADD CONSTRAINT "workflow_audit_events_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "approval_workflows"("workflow_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_audit_events" ADD CONSTRAINT "workflow_audit_events_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
