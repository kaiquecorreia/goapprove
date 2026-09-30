-- AlterTable
ALTER TABLE "purchase_orders" ADD COLUMN     "batch_id" VARCHAR(100),
ADD COLUMN     "request_id" VARCHAR(100);

-- Backfill: purchase orders received before LN started sending requestId and
-- batchId. They get an explicit LEGACY marker instead of an invented LN id,
-- and request_id reuses the primary key so each row still has a distinct value.
UPDATE "purchase_orders"
SET "request_id" = 'LEGACY-' || "purchase_order_id",
    "batch_id" = 'LEGACY'
WHERE "request_id" IS NULL;

-- AlterTable
ALTER TABLE "purchase_orders" ALTER COLUMN "batch_id" SET NOT NULL,
ALTER COLUMN "request_id" SET NOT NULL;

-- CreateIndex
CREATE INDEX "purchase_orders_company_id_request_id_idx" ON "purchase_orders"("company_id", "request_id");

-- CreateIndex
CREATE INDEX "purchase_orders_company_id_batch_id_idx" ON "purchase_orders"("company_id", "batch_id");
