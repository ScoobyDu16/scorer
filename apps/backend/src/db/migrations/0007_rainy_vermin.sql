CREATE TABLE "player_match_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" uuid NOT NULL,
	"player_id" uuid NOT NULL,
	"team" "team" NOT NULL,
	"runs" integer DEFAULT 0 NOT NULL,
	"balls_faced" integer DEFAULT 0 NOT NULL,
	"fours" integer DEFAULT 0 NOT NULL,
	"sixes" integer DEFAULT 0 NOT NULL,
	"wickets" integer DEFAULT 0 NOT NULL,
	"overs_bowled" numeric(4, 1) DEFAULT '0.0' NOT NULL,
	"runs_conceded" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "player_match_stats" ADD CONSTRAINT "player_match_stats_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_match_stats" ADD CONSTRAINT "player_match_stats_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_player_match" ON "player_match_stats" USING btree ("match_id","player_id");