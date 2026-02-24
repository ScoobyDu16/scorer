ALTER TABLE "balls" ALTER COLUMN "wicket_type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."wicket_type";--> statement-breakpoint
CREATE TYPE "public"."wicket_type" AS ENUM('BOWLED', 'CAUGHT', 'CAUGHT_AND_BOWLED', 'RUN_OUT', 'LBW', 'STUMPED', 'HIT_WICKET');--> statement-breakpoint
ALTER TABLE "balls" ALTER COLUMN "wicket_type" SET DATA TYPE "public"."wicket_type" USING "wicket_type"::"public"."wicket_type";--> statement-breakpoint
ALTER TABLE "balls" ADD COLUMN "fielder_id" uuid;--> statement-breakpoint
ALTER TABLE "player_match_stats" ADD COLUMN "batting_order" integer;--> statement-breakpoint
ALTER TABLE "balls" ADD CONSTRAINT "balls_fielder_id_players_id_fk" FOREIGN KEY ("fielder_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;