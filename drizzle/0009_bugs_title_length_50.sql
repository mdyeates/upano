ALTER TABLE "bugs" DROP CONSTRAINT "bugs_title_length";--> statement-breakpoint
ALTER TABLE "bugs" ADD CONSTRAINT "bugs_title_length" CHECK (char_length("bugs"."title") BETWEEN 1 AND 50);