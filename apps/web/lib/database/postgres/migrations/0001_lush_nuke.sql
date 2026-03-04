CREATE TABLE "ai_usage_events" (
	"id" text PRIMARY KEY NOT NULL,
	"request_id" text NOT NULL,
	"team_id" text,
	"user_id" text,
	"feature" text,
	"model" text,
	"prompt_version" integer,
	"algo_version" integer,
	"status" text DEFAULT 'ok' NOT NULL,
	"error_code" text,
	"error_message" text,
	"gateway" text,
	"provider" text,
	"cost_micros" integer,
	"trace_id" text,
	"span_id" text,
	"input_tokens" integer,
	"output_tokens" integer,
	"reasoning_tokens" integer,
	"cached_input_tokens" integer,
	"total_tokens" integer,
	"usage_json" jsonb,
	"latency_ms" integer,
	"from_cache" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ck_ai_usage_events_status" CHECK ("ai_usage_events"."status" in ('ok', 'error', 'aborted'))
);
--> statement-breakpoint
CREATE TABLE "ai_usage_traces" (
	"id" text PRIMARY KEY NOT NULL,
	"request_id" text NOT NULL,
	"team_id" text,
	"user_id" text,
	"feature" text,
	"model" text,
	"input_text" text,
	"output_text" text,
	"input_json" jsonb,
	"output_json" jsonb,
	"redacted" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone DEFAULT now() + interval '180 days' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "uidx_ai_usage_events_request_id" ON "ai_usage_events" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "idx_ai_usage_events_team_created" ON "ai_usage_events" USING btree ("team_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_ai_usage_events_team_created_total" ON "ai_usage_events" USING btree ("team_id","created_at","total_tokens");--> statement-breakpoint
CREATE INDEX "idx_ai_usage_events_team_user_created" ON "ai_usage_events" USING btree ("team_id","user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_ai_usage_events_feature_created" ON "ai_usage_events" USING btree ("feature","created_at");--> statement-breakpoint
CREATE INDEX "idx_ai_usage_events_team_feature_created" ON "ai_usage_events" USING btree ("team_id","feature","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uidx_ai_usage_traces_request_id" ON "ai_usage_traces" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "idx_ai_usage_traces_team_created" ON "ai_usage_traces" USING btree ("team_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_ai_usage_traces_team_user_created" ON "ai_usage_traces" USING btree ("team_id","user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_ai_usage_traces_expires_at" ON "ai_usage_traces" USING btree ("expires_at");