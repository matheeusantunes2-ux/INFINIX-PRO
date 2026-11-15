-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INVITED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('OWNER', 'ADMIN', 'MANAGER', 'MEMBER');

-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('DRAFT', 'SENT', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ExchangeStatus" AS ENUM ('COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "companies" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "tax_id" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'INVITED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memberships" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'MEMBER',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unit_id" UUID,
    "region_id" UUID,

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "units" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "region_id" UUID,

    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "document" TEXT,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regions" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "manager_id" UUID,
    "manager_membership_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "regions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "region_goals" (
    "id" UUID NOT NULL,
    "region_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "target" DECIMAL(14,2) NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "region_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feed_posts" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "media_url" TEXT,
    "announcement" BOOLEAN NOT NULL DEFAULT false,
    "unit_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feed_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_events" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "client_id" UUID,
    "assigned_membership_id" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposals" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "number" TEXT NOT NULL,
    "status" "ProposalStatus" NOT NULL DEFAULT 'DRAFT',
    "total" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "valid_until" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposal_items" (
    "id" UUID NOT NULL,
    "proposal_id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "unit_price" DECIMAL(14,2) NOT NULL,
    "total" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "proposal_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_entries" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "type" "TransactionType" NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "description" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "due_at" TIMESTAMP(3) NOT NULL,
    "paid_at" TIMESTAMP(3),
    "category" TEXT,
    "payment_method" TEXT,
    "reference" TEXT,
    "notes" TEXT,
    "order_id" UUID,
    "unit_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financial_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "price" DECIMAL(14,2) NOT NULL,
    "stock" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "min_stock" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "client_id" UUID,
    "seller_membership_id" UUID,
    "unit_id" UUID,
    "status" "OrderStatus" NOT NULL DEFAULT 'OPEN',
    "total" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "opened_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMP(3),
    "payment_method" TEXT,
    "notes" TEXT,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "unit_price" DECIMAL(14,2) NOT NULL,
    "total" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "order_id" UUID,
    "type" TEXT NOT NULL,
    "quantity" DECIMAL(14,3) NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "title" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "user_id" UUID,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT,
    "metadata" JSONB,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
CREATE TABLE "invitations" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'MEMBER',
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "module_permissions" (
    "id" UUID NOT NULL,
    "membership_id" UUID NOT NULL,
    "module" TEXT NOT NULL,
    "can_view" BOOLEAN NOT NULL DEFAULT false,
    "can_create" BOOLEAN NOT NULL DEFAULT false,
    "can_edit" BOOLEAN NOT NULL DEFAULT false,
    "can_delete" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "module_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feed_comments" (
    "id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "membership_id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feed_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feed_reactions" (
    "id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "membership_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feed_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_members" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "membership_id" UUID NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_reads" (
    "id" UUID NOT NULL,
    "message_id" UUID NOT NULL,
    "membership_id" UUID NOT NULL,
    "read_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_reads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "membership_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "resource_type" TEXT,
    "resource_id" UUID,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_slug_key" ON "companies"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "memberships_user_id_active_idx" ON "memberships"("user_id", "active");

-- CreateIndex
CREATE INDEX "memberships_company_id_unit_id_region_id_idx" ON "memberships"("company_id", "unit_id", "region_id");

-- CreateIndex
CREATE UNIQUE INDEX "memberships_company_id_user_id_key" ON "memberships"("company_id", "user_id");

-- CreateIndex
CREATE INDEX "units_company_id_region_id_idx" ON "units"("company_id", "region_id");

-- CreateIndex
CREATE UNIQUE INDEX "units_company_id_name_key" ON "units"("company_id", "name");

-- CreateIndex
CREATE INDEX "clients_company_id_name_idx" ON "clients"("company_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "regions_company_id_name_key" ON "regions"("company_id", "name");

-- CreateIndex
CREATE INDEX "feed_posts_company_id_created_at_idx" ON "feed_posts"("company_id", "created_at");

-- CreateIndex
CREATE INDEX "feed_posts_company_id_announcement_created_at_idx" ON "feed_posts"("company_id", "announcement", "created_at");

-- CreateIndex
CREATE INDEX "calendar_events_company_id_starts_at_idx" ON "calendar_events"("company_id", "starts_at");

-- CreateIndex
CREATE INDEX "calendar_events_company_id_assigned_membership_id_starts_at_idx" ON "calendar_events"("company_id", "assigned_membership_id", "starts_at");

-- CreateIndex
CREATE UNIQUE INDEX "proposals_company_id_number_key" ON "proposals"("company_id", "number");

-- CreateIndex
CREATE UNIQUE INDEX "financial_entries_order_id_key" ON "financial_entries"("order_id");

-- CreateIndex
CREATE INDEX "financial_entries_company_id_due_at_status_idx" ON "financial_entries"("company_id", "due_at", "status");

-- CreateIndex
CREATE INDEX "financial_entries_company_id_unit_id_due_at_idx" ON "financial_entries"("company_id", "unit_id", "due_at");

-- CreateIndex
CREATE INDEX "financial_entries_company_id_paid_at_idx" ON "financial_entries"("company_id", "paid_at");

-- CreateIndex
CREATE UNIQUE INDEX "products_company_id_sku_key" ON "products"("company_id", "sku");

-- CreateIndex
CREATE INDEX "orders_company_id_status_opened_at_idx" ON "orders"("company_id", "status", "opened_at");

-- CreateIndex
CREATE INDEX "orders_company_id_closed_at_seller_membership_id_idx" ON "orders"("company_id", "closed_at", "seller_membership_id");

-- CreateIndex
CREATE INDEX "orders_company_id_closed_at_unit_id_idx" ON "orders"("company_id", "closed_at", "unit_id");

-- CreateIndex
CREATE INDEX "stock_movements_company_id_product_id_created_at_idx" ON "stock_movements"("company_id", "product_id", "created_at");

-- CreateIndex
CREATE INDEX "conversations_company_id_created_at_idx" ON "conversations"("company_id", "created_at");

-- CreateIndex
CREATE INDEX "messages_conversation_id_created_at_idx" ON "messages"("conversation_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_company_id_created_at_idx" ON "audit_logs"("company_id", "created_at");

-- CreateIndex
CREATE INDEX "exchanges_company_id_created_at_idx" ON "exchanges"("company_id", "created_at");

-- CreateIndex
CREATE INDEX "exchanges_company_id_order_id_idx" ON "exchanges"("company_id", "order_id");

-- CreateIndex
CREATE UNIQUE INDEX "store_credits_exchange_id_key" ON "store_credits"("exchange_id");

-- CreateIndex
CREATE INDEX "store_credits_company_id_status_created_at_idx" ON "store_credits"("company_id", "status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "invitations_token_hash_key" ON "invitations"("token_hash");

-- CreateIndex
CREATE INDEX "invitations_company_id_email_idx" ON "invitations"("company_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "module_permissions_membership_id_module_key" ON "module_permissions"("membership_id", "module");

-- CreateIndex
CREATE INDEX "feed_comments_post_id_created_at_idx" ON "feed_comments"("post_id", "created_at");

-- CreateIndex
CREATE INDEX "feed_reactions_post_id_idx" ON "feed_reactions"("post_id");

-- CreateIndex
CREATE UNIQUE INDEX "feed_reactions_post_id_membership_id_key" ON "feed_reactions"("post_id", "membership_id");

-- CreateIndex
CREATE INDEX "conversation_members_membership_id_idx" ON "conversation_members"("membership_id");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_members_conversation_id_membership_id_key" ON "conversation_members"("conversation_id", "membership_id");

-- CreateIndex
CREATE INDEX "message_reads_membership_id_read_at_idx" ON "message_reads"("membership_id", "read_at");

-- CreateIndex
CREATE UNIQUE INDEX "message_reads_message_id_membership_id_key" ON "message_reads"("message_id", "membership_id");

-- CreateIndex
CREATE INDEX "notifications_membership_id_read_at_created_at_idx" ON "notifications"("membership_id", "read_at", "created_at");

-- CreateIndex
CREATE INDEX "notifications_company_id_created_at_idx" ON "notifications"("company_id", "created_at");

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "regions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "units" ADD CONSTRAINT "units_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "units" ADD CONSTRAINT "units_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "regions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regions" ADD CONSTRAINT "regions_manager_membership_id_fkey" FOREIGN KEY ("manager_membership_id") REFERENCES "memberships"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regions" ADD CONSTRAINT "regions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "region_goals" ADD CONSTRAINT "region_goals_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "regions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feed_posts" ADD CONSTRAINT "feed_posts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feed_posts" ADD CONSTRAINT "feed_posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feed_posts" ADD CONSTRAINT "feed_posts_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_assigned_membership_id_fkey" FOREIGN KEY ("assigned_membership_id") REFERENCES "memberships"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposal_items" ADD CONSTRAINT "proposal_items_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_entries" ADD CONSTRAINT "financial_entries_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_entries" ADD CONSTRAINT "financial_entries_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_entries" ADD CONSTRAINT "financial_entries_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_seller_membership_id_fkey" FOREIGN KEY ("seller_membership_id") REFERENCES "memberships"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchanges" ADD CONSTRAINT "exchanges_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchanges" ADD CONSTRAINT "exchanges_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchange_items" ADD CONSTRAINT "exchange_items_exchange_id_fkey" FOREIGN KEY ("exchange_id") REFERENCES "exchanges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchange_items" ADD CONSTRAINT "exchange_items_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchange_items" ADD CONSTRAINT "exchange_items_returned_product_id_fkey" FOREIGN KEY ("returned_product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchange_items" ADD CONSTRAINT "exchange_items_replacement_product_id_fkey" FOREIGN KEY ("replacement_product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_credits" ADD CONSTRAINT "store_credits_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_credits" ADD CONSTRAINT "store_credits_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_credits" ADD CONSTRAINT "store_credits_exchange_id_fkey" FOREIGN KEY ("exchange_id") REFERENCES "exchanges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_permissions" ADD CONSTRAINT "module_permissions_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feed_comments" ADD CONSTRAINT "feed_comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "feed_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feed_comments" ADD CONSTRAINT "feed_comments_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feed_reactions" ADD CONSTRAINT "feed_reactions_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "feed_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feed_reactions" ADD CONSTRAINT "feed_reactions_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_members" ADD CONSTRAINT "conversation_members_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_members" ADD CONSTRAINT "conversation_members_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_reads" ADD CONSTRAINT "message_reads_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_reads" ADD CONSTRAINT "message_reads_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
