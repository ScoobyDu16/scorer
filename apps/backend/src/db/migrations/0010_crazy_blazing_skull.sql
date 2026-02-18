ALTER TABLE "player_match_stats" ADD COLUMN "balls_bowled" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "player_match_stats" DROP COLUMN "overs_bowled";