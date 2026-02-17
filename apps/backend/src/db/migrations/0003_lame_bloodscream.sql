CREATE TYPE "public"."match_status" AS ENUM('UPCOMING', 'LIVE', 'COMPLETED', 'ABANDONED');--> statement-breakpoint
CREATE TYPE "public"."team" AS ENUM('A', 'B');--> statement-breakpoint
CREATE TYPE "public"."toss_decision" AS ENUM('BAT', 'BOWL');--> statement-breakpoint
CREATE TABLE "matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"turf_id" uuid NOT NULL,
	"team_a_name" varchar(150) NOT NULL,
	"team_b_name" varchar(150) NOT NULL,
	"overs" integer NOT NULL,
	"venue" varchar(200),
	"toss_winner" "team",
	"toss_decision" "toss_decision",
	"status" "match_status" DEFAULT 'UPCOMING' NOT NULL,
	"current_innings" integer DEFAULT 1 NOT NULL,
	"current_over" integer DEFAULT 0 NOT NULL,
	"current_ball" integer DEFAULT 0 NOT NULL,
	"start_time" timestamp,
	"end_time" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_turf_id_turfs_id_fk" FOREIGN KEY ("turf_id") REFERENCES "public"."turfs"("id") ON DELETE cascade ON UPDATE no action;