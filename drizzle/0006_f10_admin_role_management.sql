ALTER TABLE "audit_events" ALTER COLUMN "bug_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_scope_matches_type" CHECK ((
        ("audit_events"."event_type" = 'role_changed' AND "audit_events"."bug_id" IS NULL)
        OR
        ("audit_events"."event_type" <> 'role_changed' AND "audit_events"."bug_id" IS NOT NULL)
      ));