CREATE TYPE "public"."result_type" AS ENUM('RUNS', 'WICKETS', 'TIE');--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "winner" "team";--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "result_type" "result_type";--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "result_margin" integer;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "man_of_the_match_player_id" uuid;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_man_of_the_match_player_id_players_id_fk" FOREIGN KEY ("man_of_the_match_player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;