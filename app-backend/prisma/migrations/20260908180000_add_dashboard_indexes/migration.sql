-- CreateIndex
-- Backs the dashboard KPI groupBy, the monthly trend and the company
-- distribution: all three filter by company + erp_created_at and group by status.
CREATE INDEX "purchase_orders_company_id_status_erp_created_at_idx" ON "purchase_orders"("company_id", "status", "erp_created_at");

-- CreateIndex
-- Backs the "recent activity" widget: finalized workflows, newest decision first.
CREATE INDEX "approval_workflows_status_finalized_at_idx" ON "approval_workflows"("status", "finalized_at" DESC);
