-- CreateTable
CREATE TABLE "stripe_customers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "stripe_customer_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "payment_method_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stripe_customer_id" TEXT NOT NULL,
    "stripe_subscription_id" TEXT NOT NULL,
    "stripe_price_id" TEXT NOT NULL,
    "stripe_product_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "current_period_start" DATETIME NOT NULL,
    "current_period_end" DATETIME NOT NULL,
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "canceled_at" DATETIME,
    "trial_start" DATETIME,
    "trial_end" DATETIME,
    "revenuecat_id" TEXT,
    "last_synced_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "subscriptions_stripe_customer_id_fkey" FOREIGN KEY ("stripe_customer_id") REFERENCES "stripe_customers" ("stripe_customer_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "payment_intents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stripe_customer_id" TEXT NOT NULL,
    "stripe_payment_intent_id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "status" TEXT NOT NULL,
    "description" TEXT,
    "metadata" TEXT,
    "requires_action" BOOLEAN NOT NULL DEFAULT false,
    "client_secret" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "payment_intents_stripe_customer_id_fkey" FOREIGN KEY ("stripe_customer_id") REFERENCES "stripe_customers" ("stripe_customer_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stripe_customer_id" TEXT NOT NULL,
    "stripe_invoice_id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "status" TEXT NOT NULL,
    "period_start" DATETIME NOT NULL,
    "period_end" DATETIME NOT NULL,
    "paid_at" DATETIME,
    "due_date" DATETIME,
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "hosted_invoice_url" TEXT,
    "invoice_pdf_url" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "invoices_stripe_customer_id_fkey" FOREIGN KEY ("stripe_customer_id") REFERENCES "stripe_customers" ("stripe_customer_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stripe_event_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "event_data" TEXT NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processed_at" DATETIME,
    "error_message" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "stripe_customers_user_id_key" ON "stripe_customers"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "stripe_customers_stripe_customer_id_key" ON "stripe_customers"("stripe_customer_id");

-- CreateIndex
CREATE INDEX "stripe_customers_user_id_idx" ON "stripe_customers"("user_id");

-- CreateIndex
CREATE INDEX "stripe_customers_stripe_customer_id_idx" ON "stripe_customers"("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripe_subscription_id_key" ON "subscriptions"("stripe_subscription_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_revenuecat_id_key" ON "subscriptions"("revenuecat_id");

-- CreateIndex
CREATE INDEX "subscriptions_stripe_customer_id_idx" ON "subscriptions"("stripe_customer_id");

-- CreateIndex
CREATE INDEX "subscriptions_stripe_subscription_id_idx" ON "subscriptions"("stripe_subscription_id");

-- CreateIndex
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "payment_intents_stripe_payment_intent_id_key" ON "payment_intents"("stripe_payment_intent_id");

-- CreateIndex
CREATE INDEX "payment_intents_stripe_customer_id_idx" ON "payment_intents"("stripe_customer_id");

-- CreateIndex
CREATE INDEX "payment_intents_stripe_payment_intent_id_idx" ON "payment_intents"("stripe_payment_intent_id");

-- CreateIndex
CREATE INDEX "payment_intents_status_idx" ON "payment_intents"("status");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_stripe_invoice_id_key" ON "invoices"("stripe_invoice_id");

-- CreateIndex
CREATE INDEX "invoices_stripe_customer_id_idx" ON "invoices"("stripe_customer_id");

-- CreateIndex
CREATE INDEX "invoices_stripe_invoice_id_idx" ON "invoices"("stripe_invoice_id");

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "invoices"("status");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_events_stripe_event_id_key" ON "webhook_events"("stripe_event_id");

-- CreateIndex
CREATE INDEX "webhook_events_stripe_event_id_idx" ON "webhook_events"("stripe_event_id");

-- CreateIndex
CREATE INDEX "webhook_events_event_type_idx" ON "webhook_events"("event_type");

-- CreateIndex
CREATE INDEX "webhook_events_processed_idx" ON "webhook_events"("processed");

-- CreateIndex
CREATE INDEX "webhook_events_created_at_idx" ON "webhook_events"("created_at");
