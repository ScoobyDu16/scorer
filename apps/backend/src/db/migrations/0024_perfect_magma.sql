ALTER TABLE "matches" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "matches" ALTER COLUMN "status" SET DEFAULT 'CREATED'::text;--> statement-breakpoint
DROP TYPE "public"."match_status";--> statement-breakpoint
CREATE TYPE "public"."match_status" AS ENUM('CREATED', 'ACCESS_VERIFIED', 'PLAYERS_ADDED', 'LIVE', 'COMPLETED');--> statement-breakpoint
ALTER TABLE "matches" ALTER COLUMN "status" SET DEFAULT 'CREATED'::"public"."match_status";--> statement-breakpoint
ALTER TABLE "matches" ALTER COLUMN "status" SET DATA TYPE "public"."match_status" USING "status"::"public"."match_status";--> statement-breakpoint
ALTER TABLE "innings" ADD COLUMN "opening_bowler_id" uuid;--> statement-breakpoint
ALTER TABLE "innings" ADD CONSTRAINT "innings_opening_bowler_id_players_id_fk" FOREIGN KEY ("opening_bowler_id") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;