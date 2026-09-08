-- CreateTable
CREATE TABLE "audit_events" (
    "audit_event_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action" VARCHAR(60) NOT NULL,
    "entity" VARCHAR(60) NOT NULL,
    "entity_id" VARCHAR(100),
    "severity" VARCHAR(20) NOT NULL DEFAULT 'info',
    "message" TEXT,
    "company_id" UUID,
    "actor_user_id" UUID,
    "actor_type" VARCHAR(20) NOT NULL DEFAULT 'SYSTEM',
    "actor_label" VARCHAR(150),
    "correlation_id" UUID,
    "ip" VARCHAR(45),
    "user_agent" VARCHAR(512),
    "http_method" VARCHAR(10),
    "http_path" VARCHAR(255),
    "metadata" JSONB,
    "before" JSONB,
    "after" JSONB,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("audit_event_id")
);

-- CreateIndex
CREATE INDEX "audit_events_company_id_created_at_idx" ON "audit_events"("company_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_events_entity_entity_id_created_at_idx" ON "audit_events"("entity", "entity_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_events_company_id_action_created_at_idx" ON "audit_events"("company_id", "action", "created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_events_actor_user_id_created_at_idx" ON "audit_events"("actor_user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_events_correlation_id_idx" ON "audit_events"("correlation_id");

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("company_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: workflow_audit_events -> audit_events.
-- The generic model has no workflow_id, so the polymorphic key becomes
-- (entity='PurchaseOrder', entity_id=purchase_order_id) -- which is what the
-- OC timeline queries. The original workflow_id is preserved in metadata.
-- Primary keys are carried over, so this is idempotent by PK.
INSERT INTO "audit_events" (
  "audit_event_id", "created_at", "action", "entity", "entity_id",
  "company_id", "actor_user_id", "actor_type", "actor_label",
  "severity", "message", "metadata"
)
SELECT
  wae."event_id",
  wae."created_at",
  'workflow.' || lower(wae."type"),
  'PurchaseOrder',
  po."purchase_order_id"::text,
  po."company_id",
  wae."actor_user_id",
  CASE WHEN wae."actor_user_id" IS NULL THEN 'SYSTEM' ELSE 'USER' END,
  u."name",
  wae."severity",
  wae."message",
  COALESCE(wae."metadata", '{}'::jsonb)
    || jsonb_build_object('workflowId', wae."workflow_id")
FROM "workflow_audit_events" wae
JOIN "approval_workflows" w  ON w."workflow_id"        = wae."workflow_id"
JOIN "purchase_orders"    po ON po."purchase_order_id" = w."purchase_order_id"
LEFT JOIN "users"          u ON u."user_id"            = wae."actor_user_id"
ON CONFLICT ("audit_event_id") DO NOTHING;
