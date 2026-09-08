-- CreateIndex
CREATE INDEX "approval_workflow_approvers_user_id_status_idx" ON "approval_workflow_approvers"("user_id", "status");

-- CreateIndex
CREATE INDEX "approval_workflow_levels_workflow_id_status_idx" ON "approval_workflow_levels"("workflow_id", "status");

-- CreateIndex
CREATE INDEX "approval_workflows_status_idx" ON "approval_workflows"("status");

-- CreateIndex
CREATE INDEX "companies_users_user_id_idx" ON "companies_users"("user_id");

-- CreateIndex
CREATE INDEX "purchase_orders_company_id_erp_created_at_idx" ON "purchase_orders"("company_id", "erp_created_at");
