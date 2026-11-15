CREATE TYPE "ExchangeStatus" AS ENUM ('COMPLETED', 'CANCELLED');

CREATE TABLE "exchanges" (
  "id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "order_id" UUID NOT NULL,
  "performed_by" UUID NOT NULL,
  "reason" TEXT NOT NULL,
  "status" "ExchangeStatus" NOT NULL DEFAULT 'COMPLETED',
  "returned_value" DECIMAL(14,2) NOT NULL,
  "replacement_value" DECIMAL(14,2) NOT NULL,
  "difference" DECIMAL(14,2) NOT NULL,
  "settlement" TEXT NOT NULL,
  "payment_method" TEXT,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "exchanges_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "exchange_items" (
  "id" UUID NOT NULL,
  "exchange_id" UUID NOT NULL,
  "order_item_id" UUID NOT NULL,
  "returned_product_id" UUID NOT NULL,
  "replacement_product_id" UUID,
  "returned_quantity" DECIMAL(12,3) NOT NULL,
  "replacement_quantity" DECIMAL(12,3) NOT NULL DEFAULT 0,
  "returned_unit_value" DECIMAL(14,2) NOT NULL,
  "replacement_unit_value" DECIMAL(14,2),
  "condition" TEXT NOT NULL,
  CONSTRAINT "exchange_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "exchanges_company_id_created_at_idx" ON "exchanges"("company_id","created_at");
CREATE INDEX "exchanges_company_id_order_id_idx" ON "exchanges"("company_id","order_id");

ALTER TABLE "exchanges" ADD CONSTRAINT "exchanges_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "exchanges" ADD CONSTRAINT "exchanges_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "exchange_items" ADD CONSTRAINT "exchange_items_exchange_id_fkey" FOREIGN KEY ("exchange_id") REFERENCES "exchanges"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "exchange_items" ADD CONSTRAINT "exchange_items_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "exchange_items" ADD CONSTRAINT "exchange_items_returned_product_id_fkey" FOREIGN KEY ("returned_product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "exchange_items" ADD CONSTRAINT "exchange_items_replacement_product_id_fkey" FOREIGN KEY ("replacement_product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
