ALTER TABLE "users" DROP CONSTRAINT "users_email_unique";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_name_length";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "email";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "name";