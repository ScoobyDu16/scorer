CREATE TYPE "public"."extra_type" AS ENUM('WIDE', 'NO_BALL', 'BYE', 'LEG_BYE');--> statement-breakpoint
CREATE TYPE "public"."wicket_type" AS ENUM('BOWLED', 'CAUGHT', 'RUN_OUT', 'LBW', 'STUMPED', 'HIT_WICKET', 'RETIRED');--> statement-breakpoint
CREATE TABLE "balls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" uuid NOT NULL,
	"innings_id" uuid NOT NULL,
	"over_number" integer NOT NULL,
	"ball_number" integer NOT NULL,
	"batsman_id" uuid NOT NULL,
	"bowler_id" uuid NOT NULL,
	"runs" integer DEFAULT 0 NOT NULL,
	"extra_type" "extra_type",
	"extra_runs" integer DEFAULT 0,
	"is_wicket" boolean DEFAULT false NOT NULL,
	"wicket_type" "wicket_type",
	"dismissed_player_id" uuid,
	"is_legal_delivery" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "balls" ADD CONSTRAINT "balls_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "balls" ADD CONSTRAINT "balls_innings_id_innings_id_fk" FOREIGN KEY ("innings_id") REFERENCES "public"."innings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "balls" ADD CONSTRAINT "balls_batsman_id_players_id_fk" FOREIGN KEY ("batsman_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "balls" ADD CONSTRAINT "balls_bowler_id_players_id_fk" FOREIGN KEY ("bowler_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "balls" ADD CONSTRAINT "balls_dismissed_player_id_players_id_fk" FOREIGN KEY ("dismissed_player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_balls_match" ON "balls" USING btree ("match_id");--> statement-breakpoint
CREATE INDEX "idx_balls_innings" ON "balls" USING btree ("innings_id");--> statement-breakpoint
CREATE INDEX "idx_balls_over" ON "balls" USING btree ("match_id","innings_id","over_number");