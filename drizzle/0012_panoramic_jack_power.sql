ALTER TABLE "kai_conversations" ADD COLUMN "status" text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "kai_conversations" ADD COLUMN "model" text DEFAULT 'kai' NOT NULL;--> statement-breakpoint
ALTER TABLE "kai_conversations" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "kai_messages" ADD COLUMN "model" text;--> statement-breakpoint
CREATE INDEX "kai_conv_ws_status_idx" ON "kai_conversations" USING btree ("workspace_id","status","updated_at");