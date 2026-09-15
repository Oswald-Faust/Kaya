CREATE TYPE "public"."approval_status" AS ENUM('pending', 'approved', 'rejected', 'expired');--> statement-breakpoint
CREATE TYPE "public"."autonomy_mode" AS ENUM('observe', 'suggest', 'copilot', 'autopilot');--> statement-breakpoint
CREATE TYPE "public"."connection_mode" AS ENUM('live', 'demo');--> statement-breakpoint
CREATE TYPE "public"."experiment_outcome" AS ENUM('winner', 'loser', 'inconclusive');--> statement-breakpoint
CREATE TYPE "public"."experiment_status" AS ENUM('idea', 'proposed', 'awaiting_approval', 'scheduled', 'running', 'evaluating', 'completed', 'archived', 'suppressed');--> statement-breakpoint
CREATE TYPE "public"."fact_kind" AS ENUM('verified', 'inferred', 'hypothesis', 'user_correction', 'learning');--> statement-breakpoint
CREATE TYPE "public"."fact_status" AS ENUM('proposed', 'confirmed', 'rejected', 'superseded');--> statement-breakpoint
CREATE TYPE "public"."integration_status" AS ENUM('connected', 'disconnected', 'error');--> statement-breakpoint
CREATE TYPE "public"."member_role" AS ENUM('owner', 'admin', 'member', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."product_status" AS ENUM('analyzing', 'needs_review', 'active', 'failed');--> statement-breakpoint
CREATE TYPE "public"."risk_class" AS ENUM('R0', 'R1', 'R2', 'R3', 'R4');--> statement-breakpoint
CREATE TYPE "public"."run_status" AS ENUM('queued', 'planning', 'running', 'awaiting_approval', 'completed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."step_status" AS ENUM('pending', 'running', 'done', 'failed', 'skipped', 'waiting');--> statement-breakpoint
CREATE TABLE "agent_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"run_id" text NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"product_id" text,
	"kind" text NOT NULL,
	"goal" text NOT NULL,
	"status" "run_status" DEFAULT 'queued' NOT NULL,
	"plan" jsonb,
	"result" jsonb,
	"error" text,
	"planner" text NOT NULL,
	"model" text,
	"prompt_version" text,
	"created_by" text NOT NULL,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_steps" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"run_id" text NOT NULL,
	"seq" integer NOT NULL,
	"kind" text NOT NULL,
	"title" text NOT NULL,
	"detail" text,
	"status" "step_status" DEFAULT 'pending' NOT NULL,
	"output" jsonb,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "analytics_events" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"product_id" text NOT NULL,
	"name" text NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"anonymous_id" text,
	"customer_id" text,
	"source" text NOT NULL,
	"channel" text,
	"campaign_id" text,
	"experiment_id" text,
	"variant_id" text,
	"value" double precision,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "approvals" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"run_id" text,
	"tool_call_id" text,
	"experiment_id" text,
	"title" text NOT NULL,
	"change" text,
	"reason" text NOT NULL,
	"risk" "risk_class" NOT NULL,
	"tool" text NOT NULL,
	"tool_input" jsonb NOT NULL,
	"policy_decision" jsonb NOT NULL,
	"status" "approval_status" DEFAULT 'pending' NOT NULL,
	"decided_by" text,
	"decision_note" text,
	"decided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"actor_type" text NOT NULL,
	"actor_id" text NOT NULL,
	"action" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text,
	"tool_call_id" text,
	"approval_id" text,
	"is_external_mutation" boolean DEFAULT false NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brand_profiles" (
	"product_id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"voice_summary" text NOT NULL,
	"traits" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"words_to_use" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"words_to_avoid" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "budget_policies" (
	"workspace_id" text PRIMARY KEY NOT NULL,
	"monthly_budget" double precision NOT NULL,
	"max_daily_spend" double precision NOT NULL,
	"max_experiment_budget" double precision NOT NULL,
	"max_auto_increase_pct" double precision NOT NULL,
	"auto_pause_losers" boolean DEFAULT true NOT NULL,
	"auto_launch_campaigns" boolean DEFAULT false NOT NULL,
	"allowed_channels" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"never_without_approval" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_facts" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"product_id" text NOT NULL,
	"key" text NOT NULL,
	"category" text NOT NULL,
	"statement" text NOT NULL,
	"value" jsonb,
	"kind" "fact_kind" NOT NULL,
	"status" "fact_status" DEFAULT 'proposed' NOT NULL,
	"confidence" double precision NOT NULL,
	"source_id" text,
	"source_label" text NOT NULL,
	"evidence" text,
	"agent_generated" boolean DEFAULT true NOT NULL,
	"user_confirmed" boolean DEFAULT false NOT NULL,
	"supersedes_id" text,
	"last_verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"experiment_id" text,
	"integration_id" text,
	"channel" text NOT NULL,
	"name" text NOT NULL,
	"external_id" text,
	"status" text NOT NULL,
	"daily_budget" double precision,
	"spend" double precision DEFAULT 0 NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "channel_assessments" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"strategy_version_id" text NOT NULL,
	"channel" text NOT NULL,
	"score" integer NOT NULL,
	"verdict" text NOT NULL,
	"factors" jsonb NOT NULL,
	"rationale" text NOT NULL,
	"evidence" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "competitors" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"product_id" text NOT NULL,
	"name" text NOT NULL,
	"url" text,
	"kind" text NOT NULL,
	"positioning" text,
	"pricing_summary" text,
	"wedge" text,
	"confidence" double precision NOT NULL,
	"status" "fact_status" DEFAULT 'proposed' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "creative_assets" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"experiment_id" text,
	"kind" text NOT NULL,
	"channel" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credential_references" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"provider" text NOT NULL,
	"vault_key" text NOT NULL,
	"auth_type" text NOT NULL,
	"scopes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"expires_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "experiment_variants" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"experiment_id" text NOT NULL,
	"name" text NOT NULL,
	"is_control" boolean DEFAULT false NOT NULL,
	"description" text NOT NULL,
	"exposures" integer DEFAULT 0 NOT NULL,
	"conversions" integer DEFAULT 0 NOT NULL,
	"spend" double precision DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "experiments" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"product_id" text NOT NULL,
	"strategy_version_id" text,
	"number" integer NOT NULL,
	"name" text NOT NULL,
	"hypothesis" text NOT NULL,
	"type" text NOT NULL,
	"channel" text NOT NULL,
	"audience" text NOT NULL,
	"icp_id" text,
	"primary_metric" text NOT NULL,
	"metric_direction" text NOT NULL,
	"baseline_value" double precision,
	"success_threshold" double precision NOT NULL,
	"budget" double precision DEFAULT 0 NOT NULL,
	"spend" double precision DEFAULT 0 NOT NULL,
	"daily_spend_cap" double precision,
	"status" "experiment_status" DEFAULT 'proposed' NOT NULL,
	"outcome" "experiment_outcome",
	"observed_value" double precision,
	"lift" double precision,
	"confidence" double precision,
	"result_summary" text,
	"impact" integer NOT NULL,
	"prior_confidence" double precision NOT NULL,
	"effort" integer NOT NULL,
	"information_gain" integer NOT NULL,
	"time_to_signal_days" integer NOT NULL,
	"duration_days" integer NOT NULL,
	"similarity_key" text NOT NULL,
	"suppressed_reason" text,
	"rationale" text NOT NULL,
	"started_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "goals" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"product_id" text NOT NULL,
	"template" text NOT NULL,
	"title" text NOT NULL,
	"metric" text NOT NULL,
	"baseline_value" double precision,
	"target_value" double precision,
	"unit" text NOT NULL,
	"deadline" date,
	"monthly_budget" double precision NOT NULL,
	"budget_band" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "icps" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"product_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"pains" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"triggers" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"objections" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"where_they_are" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"priority" integer NOT NULL,
	"confidence" double precision NOT NULL,
	"status" "fact_status" DEFAULT 'proposed' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "integrations" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"provider" text NOT NULL,
	"status" "integration_status" DEFAULT 'disconnected' NOT NULL,
	"mode" "connection_mode" DEFAULT 'demo' NOT NULL,
	"granted_capabilities" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"health" text DEFAULT 'unknown' NOT NULL,
	"last_synced_at" timestamp with time zone,
	"sync_error" text,
	"credential_ref_id" text,
	"connected_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_sources" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"product_id" text NOT NULL,
	"kind" text NOT NULL,
	"uri" text,
	"title" text NOT NULL,
	"content_hash" text,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learnings" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"product_id" text NOT NULL,
	"statement" text NOT NULL,
	"kind" text NOT NULL,
	"channel" text,
	"similarity_key" text,
	"confidence" double precision NOT NULL,
	"impact" text NOT NULL,
	"evidence_experiment_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"metric_label" text,
	"status" text DEFAULT 'active' NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" "member_role" DEFAULT 'member' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "metric_snapshots" (
	"workspace_id" text NOT NULL,
	"product_id" text NOT NULL,
	"day" date NOT NULL,
	"channel" text NOT NULL,
	"impressions" integer DEFAULT 0 NOT NULL,
	"clicks" integer DEFAULT 0 NOT NULL,
	"visits" integer DEFAULT 0 NOT NULL,
	"signups" integer DEFAULT 0 NOT NULL,
	"activations" integer DEFAULT 0 NOT NULL,
	"trials" integer DEFAULT 0 NOT NULL,
	"paid_conversions" integer DEFAULT 0 NOT NULL,
	"new_mrr" double precision DEFAULT 0 NOT NULL,
	"churned_mrr" double precision DEFAULT 0 NOT NULL,
	"mrr" double precision DEFAULT 0 NOT NULL,
	"customers" integer DEFAULT 0 NOT NULL,
	"spend" double precision DEFAULT 0 NOT NULL,
	"source" text NOT NULL,
	CONSTRAINT "metric_snapshots_product_id_day_channel_pk" PRIMARY KEY("product_id","day","channel")
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "personas" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"icp_id" text NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"jobs" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_snapshots" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"product_id" text NOT NULL,
	"source_url" text NOT NULL,
	"pages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"extraction" jsonb,
	"extractor" text NOT NULL,
	"model" text,
	"prompt_version" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"domain" text NOT NULL,
	"logo_url" text,
	"one_liner" text,
	"category" text,
	"status" "product_status" DEFAULT 'analyzing' NOT NULL,
	"onboarding_step" text DEFAULT 'analyze' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "strategies" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"product_id" text NOT NULL,
	"goal_id" text,
	"current_version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "strategy_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"strategy_id" text NOT NULL,
	"version" integer NOT NULL,
	"summary" text NOT NULL,
	"revision_reason" text NOT NULL,
	"evidence_learning_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"content" jsonb NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tool_calls" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"run_id" text NOT NULL,
	"step_id" text,
	"tool" text NOT NULL,
	"capability" text NOT NULL,
	"risk" "risk_class" NOT NULL,
	"input" jsonb NOT NULL,
	"output" jsonb,
	"status" text NOT NULL,
	"dry_run" boolean DEFAULT false NOT NULL,
	"idempotency_key" text NOT NULL,
	"adapter" text,
	"is_demo" boolean DEFAULT false NOT NULL,
	"error" text,
	"duration_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"autonomy_mode" "autonomy_mode" DEFAULT 'copilot' NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agent_messages" ADD CONSTRAINT "agent_messages_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_messages" ADD CONSTRAINT "agent_messages_run_id_agent_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."agent_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_steps" ADD CONSTRAINT "agent_steps_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_steps" ADD CONSTRAINT "agent_steps_run_id_agent_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."agent_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_run_id_agent_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."agent_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_tool_call_id_tool_calls_id_fk" FOREIGN KEY ("tool_call_id") REFERENCES "public"."tool_calls"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_experiment_id_experiments_id_fk" FOREIGN KEY ("experiment_id") REFERENCES "public"."experiments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_profiles" ADD CONSTRAINT "brand_profiles_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_profiles" ADD CONSTRAINT "brand_profiles_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_policies" ADD CONSTRAINT "budget_policies_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_facts" ADD CONSTRAINT "business_facts_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_facts" ADD CONSTRAINT "business_facts_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_facts" ADD CONSTRAINT "business_facts_source_id_knowledge_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."knowledge_sources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_experiment_id_experiments_id_fk" FOREIGN KEY ("experiment_id") REFERENCES "public"."experiments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_integration_id_integrations_id_fk" FOREIGN KEY ("integration_id") REFERENCES "public"."integrations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channel_assessments" ADD CONSTRAINT "channel_assessments_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channel_assessments" ADD CONSTRAINT "channel_assessments_strategy_version_id_strategy_versions_id_fk" FOREIGN KEY ("strategy_version_id") REFERENCES "public"."strategy_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitors" ADD CONSTRAINT "competitors_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitors" ADD CONSTRAINT "competitors_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creative_assets" ADD CONSTRAINT "creative_assets_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creative_assets" ADD CONSTRAINT "creative_assets_experiment_id_experiments_id_fk" FOREIGN KEY ("experiment_id") REFERENCES "public"."experiments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credential_references" ADD CONSTRAINT "credential_references_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experiment_variants" ADD CONSTRAINT "experiment_variants_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experiment_variants" ADD CONSTRAINT "experiment_variants_experiment_id_experiments_id_fk" FOREIGN KEY ("experiment_id") REFERENCES "public"."experiments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experiments" ADD CONSTRAINT "experiments_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experiments" ADD CONSTRAINT "experiments_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experiments" ADD CONSTRAINT "experiments_strategy_version_id_strategy_versions_id_fk" FOREIGN KEY ("strategy_version_id") REFERENCES "public"."strategy_versions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experiments" ADD CONSTRAINT "experiments_icp_id_icps_id_fk" FOREIGN KEY ("icp_id") REFERENCES "public"."icps"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "icps" ADD CONSTRAINT "icps_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "icps" ADD CONSTRAINT "icps_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_credential_ref_id_credential_references_id_fk" FOREIGN KEY ("credential_ref_id") REFERENCES "public"."credential_references"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_sources" ADD CONSTRAINT "knowledge_sources_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_sources" ADD CONSTRAINT "knowledge_sources_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learnings" ADD CONSTRAINT "learnings_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learnings" ADD CONSTRAINT "learnings_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "metric_snapshots" ADD CONSTRAINT "metric_snapshots_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "metric_snapshots" ADD CONSTRAINT "metric_snapshots_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personas" ADD CONSTRAINT "personas_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personas" ADD CONSTRAINT "personas_icp_id_icps_id_fk" FOREIGN KEY ("icp_id") REFERENCES "public"."icps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_snapshots" ADD CONSTRAINT "product_snapshots_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_snapshots" ADD CONSTRAINT "product_snapshots_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strategies" ADD CONSTRAINT "strategies_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strategies" ADD CONSTRAINT "strategies_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strategies" ADD CONSTRAINT "strategies_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strategy_versions" ADD CONSTRAINT "strategy_versions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strategy_versions" ADD CONSTRAINT "strategy_versions_strategy_id_strategies_id_fk" FOREIGN KEY ("strategy_id") REFERENCES "public"."strategies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_calls" ADD CONSTRAINT "tool_calls_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_calls" ADD CONSTRAINT "tool_calls_run_id_agent_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."agent_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_calls" ADD CONSTRAINT "tool_calls_step_id_agent_steps_id_fk" FOREIGN KEY ("step_id") REFERENCES "public"."agent_steps"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "messages_run_idx" ON "agent_messages" USING btree ("run_id","created_at");--> statement-breakpoint
CREATE INDEX "runs_ws_idx" ON "agent_runs" USING btree ("workspace_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "steps_run_seq_idx" ON "agent_steps" USING btree ("run_id","seq");--> statement-breakpoint
CREATE INDEX "events_ws_name_time_idx" ON "analytics_events" USING btree ("workspace_id","name","occurred_at");--> statement-breakpoint
CREATE INDEX "approvals_ws_status_idx" ON "approvals" USING btree ("workspace_id","status");--> statement-breakpoint
CREATE INDEX "audit_ws_time_idx" ON "audit_logs" USING btree ("workspace_id","created_at");--> statement-breakpoint
CREATE INDEX "facts_product_key_idx" ON "business_facts" USING btree ("product_id","key");--> statement-breakpoint
CREATE INDEX "facts_product_category_idx" ON "business_facts" USING btree ("product_id","category","status");--> statement-breakpoint
CREATE INDEX "campaigns_workspace_idx" ON "campaigns" USING btree ("workspace_id","status");--> statement-breakpoint
CREATE INDEX "channel_assessments_version_idx" ON "channel_assessments" USING btree ("strategy_version_id","score");--> statement-breakpoint
CREATE INDEX "competitors_product_idx" ON "competitors" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "assets_experiment_idx" ON "creative_assets" USING btree ("experiment_id");--> statement-breakpoint
CREATE INDEX "variants_experiment_idx" ON "experiment_variants" USING btree ("experiment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "experiments_number_idx" ON "experiments" USING btree ("workspace_id","number");--> statement-breakpoint
CREATE INDEX "experiments_status_idx" ON "experiments" USING btree ("workspace_id","status");--> statement-breakpoint
CREATE INDEX "experiments_similarity_idx" ON "experiments" USING btree ("workspace_id","similarity_key");--> statement-breakpoint
CREATE INDEX "goals_product_idx" ON "goals" USING btree ("product_id","status");--> statement-breakpoint
CREATE INDEX "icps_product_idx" ON "icps" USING btree ("product_id","priority");--> statement-breakpoint
CREATE UNIQUE INDEX "integrations_ws_provider_idx" ON "integrations" USING btree ("workspace_id","provider");--> statement-breakpoint
CREATE INDEX "sources_product_idx" ON "knowledge_sources" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "learnings_ws_idx" ON "learnings" USING btree ("workspace_id","status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "members_org_user_idx" ON "members" USING btree ("organization_id","user_id");--> statement-breakpoint
CREATE INDEX "metrics_ws_day_idx" ON "metric_snapshots" USING btree ("workspace_id","day");--> statement-breakpoint
CREATE INDEX "snapshots_product_idx" ON "product_snapshots" USING btree ("product_id","created_at");--> statement-breakpoint
CREATE INDEX "products_workspace_idx" ON "products" USING btree ("workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "strategies_product_idx" ON "strategies" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "strategy_versions_idx" ON "strategy_versions" USING btree ("strategy_id","version");--> statement-breakpoint
CREATE UNIQUE INDEX "tool_calls_idem_idx" ON "tool_calls" USING btree ("workspace_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "tool_calls_run_idx" ON "tool_calls" USING btree ("run_id");--> statement-breakpoint
CREATE UNIQUE INDEX "workspaces_org_slug_idx" ON "workspaces" USING btree ("organization_id","slug");