CREATE TYPE "public"."audit_event_type" AS ENUM('bug_created', 'status_changed', 'priority_changed', 'severity_changed', 'assignee_changed', 'comment_added', 'comment_edited', 'comment_deleted', 'bug_deleted', 'role_changed');--> statement-breakpoint
CREATE TYPE "public"."bug_priority" AS ENUM('p0', 'p1', 'p2', 'p3', 'p4');--> statement-breakpoint
CREATE TYPE "public"."bug_severity" AS ENUM('sev1', 'sev2', 'sev3', 'sev4');--> statement-breakpoint
CREATE TYPE "public"."bug_status" AS ENUM('new', 'triaged', 'in_progress', 'in_review', 'resolved', 'closed');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('reporter', 'sde', 'admin');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"bug_id" integer NOT NULL,
	"actor_id" text NOT NULL,
	"event_type" "audit_event_type" NOT NULL,
	"field" text,
	"old_value" text,
	"new_value" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bugs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "bugs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"title" text NOT NULL,
	"description" text NOT NULL,
	"status" "bug_status" DEFAULT 'new' NOT NULL,
	"priority" "bug_priority" DEFAULT 'p3' NOT NULL,
	"severity" "bug_severity" DEFAULT 'sev3' NOT NULL,
	"reporter_id" text NOT NULL,
	"assignee_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"closed_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "bugs_closed_at_iff_closed" CHECK (("bugs"."status" = 'closed') = ("bugs"."closed_at" IS NOT NULL)),
	CONSTRAINT "bugs_title_length" CHECK (char_length("bugs"."title") BETWEEN 1 AND 200),
	CONSTRAINT "bugs_description_length" CHECK (char_length("bugs"."description") BETWEEN 1 AND 10000)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "comments" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bug_id" integer NOT NULL,
	"author_id" text NOT NULL,
	"body" text NOT NULL,
	"parent_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "comments_body_length" CHECK (char_length("comments"."body") BETWEEN 1 AND 10000)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"display_name" text,
	"role" "user_role" DEFAULT 'reporter' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_name_length" CHECK (char_length("users"."name") BETWEEN 1 AND 100)
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_bug_id_bugs_id_fk" FOREIGN KEY ("bug_id") REFERENCES "public"."bugs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bugs" ADD CONSTRAINT "bugs_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bugs" ADD CONSTRAINT "bugs_assignee_id_users_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "comments" ADD CONSTRAINT "comments_bug_id_bugs_id_fk" FOREIGN KEY ("bug_id") REFERENCES "public"."bugs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "comments" ADD CONSTRAINT "comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_events_bug_idx" ON "audit_events" USING btree ("bug_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_events_actor_idx" ON "audit_events" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_events_created_at_idx" ON "audit_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_events_type_idx" ON "audit_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bugs_status_idx" ON "bugs" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bugs_assignee_idx" ON "bugs" USING btree ("assignee_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bugs_reporter_idx" ON "bugs" USING btree ("reporter_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bugs_status_priority_idx" ON "bugs" USING btree ("status","priority");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "comments_bug_idx" ON "comments" USING btree ("bug_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "comments_parent_idx" ON "comments" USING btree ("parent_id");