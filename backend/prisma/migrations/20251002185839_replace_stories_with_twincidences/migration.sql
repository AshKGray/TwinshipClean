/*
  Warnings:

  - You are about to drop the `stories` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "stories";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "twincidences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "twin_pair_id" TEXT NOT NULL,
    "created_by" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "photos" TEXT,
    "event_type" TEXT NOT NULL,
    "detection_method" TEXT,
    "user1_event_time" DATETIME,
    "user2_event_time" DATETIME,
    "time_difference" INTEGER,
    "event_data" TEXT,
    "shared_with_twin" BOOLEAN NOT NULL DEFAULT false,
    "user1_consented" BOOLEAN NOT NULL DEFAULT false,
    "user2_consented" BOOLEAN NOT NULL DEFAULT false,
    "included_in_research" BOOLEAN NOT NULL DEFAULT false,
    "anonymized_data" TEXT,
    "is_special" BOOLEAN NOT NULL DEFAULT false,
    "severity" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME
);

-- CreateTable
CREATE TABLE "twincidence_consents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "consent_level" TEXT NOT NULL,
    "consented_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "revoked_at" DATETIME,
    "previous_consent" TEXT
);

-- CreateTable
CREATE TABLE "event_type_catalog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "event_type" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT,
    "category" TEXT NOT NULL,
    "detection_enabled" BOOLEAN NOT NULL DEFAULT true,
    "requires_healthkit" BOOLEAN NOT NULL DEFAULT false,
    "requires_location" BOOLEAN NOT NULL DEFAULT false,
    "thresholds" TEXT,
    "research_enabled" BOOLEAN NOT NULL DEFAULT true,
    "minimum_data_points" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "twincidences_twin_pair_id_idx" ON "twincidences"("twin_pair_id");

-- CreateIndex
CREATE INDEX "twincidences_event_type_idx" ON "twincidences"("event_type");

-- CreateIndex
CREATE INDEX "twincidences_created_at_idx" ON "twincidences"("created_at");

-- CreateIndex
CREATE INDEX "twincidences_is_special_idx" ON "twincidences"("is_special");

-- CreateIndex
CREATE INDEX "twincidences_shared_with_twin_idx" ON "twincidences"("shared_with_twin");

-- CreateIndex
CREATE INDEX "twincidences_deleted_at_idx" ON "twincidences"("deleted_at");

-- CreateIndex
CREATE INDEX "twincidence_consents_user_id_idx" ON "twincidence_consents"("user_id");

-- CreateIndex
CREATE INDEX "twincidence_consents_event_type_idx" ON "twincidence_consents"("event_type");

-- CreateIndex
CREATE INDEX "twincidence_consents_consent_level_idx" ON "twincidence_consents"("consent_level");

-- CreateIndex
CREATE UNIQUE INDEX "twincidence_consents_user_id_event_type_key" ON "twincidence_consents"("user_id", "event_type");

-- CreateIndex
CREATE UNIQUE INDEX "event_type_catalog_event_type_key" ON "event_type_catalog"("event_type");

-- CreateIndex
CREATE INDEX "event_type_catalog_category_idx" ON "event_type_catalog"("category");

-- CreateIndex
CREATE INDEX "event_type_catalog_is_active_idx" ON "event_type_catalog"("is_active");

-- CreateIndex
CREATE INDEX "event_type_catalog_sort_order_idx" ON "event_type_catalog"("sort_order");
