CREATE TABLE "store_credits" (
 "id" UUID NOT NULL,
 "company_id" UUID NOT NULL,
 "order_id" UUID NOT NULL,
 "exchange_id" UUID NOT NULL,
 "amount" DECIMAL(14,2) NOT NULL,
 "balance" DECIMAL(14,2) NOT NULL,
 "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
 "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "store_credits_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "store_credits_exchange_id_key" ON "store_credits"("exchange_id");
CREATE INDEX "store_credits_company_id_status_created_at_idx" ON "store_credits"("company_id","status","created_at");
ALTER TABLE "store_credits" ADD CONSTRAINT "store_credits_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "store_credits" ADD CONSTRAINT "store_credits_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "store_credits" ADD CONSTRAINT "store_credits_exchange_id_fkey" FOREIGN KEY ("exchange_id") REFERENCES "exchanges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
