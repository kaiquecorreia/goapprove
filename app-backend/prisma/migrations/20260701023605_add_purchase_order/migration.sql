-- CreateTable
CREATE TABLE "purchase_orders" (
    "purchase_order_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "source_system" VARCHAR(50) NOT NULL,
    "event_type" VARCHAR(100) NOT NULL,
    "schema_version" VARCHAR(20) NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL,
    "order_number" VARCHAR(50) NOT NULL,
    "revision" INTEGER NOT NULL,
    "order_type" VARCHAR(50) NOT NULL,
    "status_ln" VARCHAR(50) NOT NULL,
    "erp_created_at" TIMESTAMP(3) NOT NULL,
    "buyer_code" VARCHAR(50),
    "buyer_name" VARCHAR(150),
    "requester_code" VARCHAR(50),
    "requester_name" VARCHAR(150),
    "supplier_code" VARCHAR(50),
    "supplier_name" VARCHAR(150),
    "currency" VARCHAR(10),
    "total_amount" DECIMAL(15,2) NOT NULL,
    "payment_terms" VARCHAR(50),
    "cost_center" VARCHAR(50),
    "department" VARCHAR(150),
    "project_code" VARCHAR(50),
    "warehouse" VARCHAR(50),
    "additional_fields" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("purchase_order_id")
);

-- CreateTable
CREATE TABLE "purchase_order_lines" (
    "purchase_order_line_id" UUID NOT NULL,
    "purchase_order_id" UUID NOT NULL,
    "line_number" INTEGER NOT NULL,
    "item_code" VARCHAR(50) NOT NULL,
    "item_description" VARCHAR(255) NOT NULL,
    "quantity" DECIMAL(15,4) NOT NULL,
    "unit_of_measure" VARCHAR(10) NOT NULL,
    "unit_price" DECIMAL(15,4) NOT NULL,
    "line_amount" DECIMAL(15,2) NOT NULL,
    "cost_center" VARCHAR(50),
    "category" VARCHAR(100),
    "delivery_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_order_lines_pkey" PRIMARY KEY ("purchase_order_line_id")
);

-- CreateIndex
CREATE INDEX "purchase_orders_company_id_order_number_idx" ON "purchase_orders"("company_id", "order_number");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_order_lines_purchase_order_id_line_number_key" ON "purchase_order_lines"("purchase_order_id", "line_number");

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("company_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_lines" ADD CONSTRAINT "purchase_order_lines_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("purchase_order_id") ON DELETE CASCADE ON UPDATE CASCADE;
