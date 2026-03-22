CREATE TYPE "public"."dismissal_type" AS ENUM('BOWLED', 'CAUGHT', 'CAUGHT_AND_BOWLED', 'RUN_OUT', 'LBW', 'STUMPED', 'HIT_WICKET', 'RETIRED');--> statement-breakpoint
CREATE TYPE "public"."extra_type" AS ENUM('WIDE', 'NO_BALL', 'BYE', 'LEG_BYE');--> statement-breakpoint
CREATE TYPE "public"."innings_status" AS ENUM('UPCOMING', 'LIVE', 'COMPLETED');--> statement-breakpoint
CREATE TYPE "public"."match_status" AS ENUM('CREATED', 'ACCESS_VERIFIED', 'PLAYERS_ADDED', 'LIVE', 'COMPLETED');--> statement-breakpoint
CREATE TYPE "public"."result_type" AS ENUM('RUNS', 'WICKETS', 'TIE');--> statement-breakpoint
CREATE TYPE "public"."team" AS ENUM('A', 'B');--> statement-breakpoint
CREATE TYPE "public"."toss_decision" AS ENUM('BAT', 'BOWL');--> statement-breakpoint
CREATE TYPE "public"."wicket_type" AS ENUM('BOWLED', 'CAUGHT', 'CAUGHT_AND_BOWLED', 'RUN_OUT', 'LBW', 'STUMPED', 'HIT_WICKET');--> statement-breakpoint
CREATE TABLE "access_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"turf_id" uuid NOT NULL,
	"code" varchar(6) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"is_used" boolean DEFAULT false NOT NULL,
	"match_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
	"fielder_id" uuid,
	"is_legal_delivery" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "turfs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(150) NOT NULL,
	"slug" varchar(150) NOT NULL,
	"phone" varchar(20),
	"email" varchar(150),
	"gst_number" varchar(20),
	"address_line_1" text,
	"city" varchar(100),
	"state" varchar(100),
	"country" varchar(100) DEFAULT 'India',
	"pincode" varchar(10),
	"logo_url" text,
	"map_location" text,
	"verification_status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"verified_at" timestamp,
	"verified_by" uuid,
	"subscription_status" varchar(20) DEFAULT 'TRIAL' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "turfs_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone" varchar(20),
	"email" varchar(150),
	"name" varchar(150),
	"avatar_url" text,
	"password_hash" text,
	"is_phone_verified" boolean DEFAULT false NOT NULL,
	"is_email_verified" boolean DEFAULT false NOT NULL,
	"status" varchar(20) DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_phone_unique" UNIQUE("phone"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "permissions_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role_id" uuid NOT NULL,
	"permission_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"turf_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(50) NOT NULL,
	"price_monthly" numeric(10, 2),
	"price_yearly" numeric(10, 2),
	"features_json" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "plans_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"turf_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"status" varchar(20) DEFAULT 'TRIAL' NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"trial_ends_at" timestamp,
	"payment_provider" varchar(50),
	"payment_subscription_id" varchar(150),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"turf_id" uuid NOT NULL,
	"name" varchar(150) NOT NULL,
	"phone" varchar(20),
	"email" varchar(150),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"turf_id" uuid NOT NULL,
	"team_a_name" varchar(150) NOT NULL,
	"team_b_name" varchar(150) NOT NULL,
	"overs" integer NOT NULL,
	"venue" varchar(200),
	"toss_winner" "team",
	"toss_decision" "toss_decision",
	"status" "match_status" DEFAULT 'CREATED' NOT NULL,
	"current_innings" integer DEFAULT 1 NOT NULL,
	"winner" "team",
	"result_type" "result_type",
	"result_margin" integer,
	"man_of_the_match_player_id" uuid,
	"players_per_team" integer DEFAULT 11 NOT NULL,
	"start_time" timestamp,
	"end_time" timestamp,
	"active_scorer_id" uuid,
	"scorer_session_id" uuid,
	"lock_expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "match_players" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" uuid NOT NULL,
	"player_id" uuid NOT NULL,
	"team" "team" NOT NULL,
	"is_playing" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "innings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" uuid NOT NULL,
	"innings_number" integer NOT NULL,
	"batting_team" "team" NOT NULL,
	"opening_striker_id" uuid,
	"opening_non_striker_id" uuid,
	"opening_bowler_id" uuid,
	"current_striker_id" uuid,
	"current_non_striker_id" uuid,
	"current_bowler_id" uuid,
	"total_runs" integer DEFAULT 0 NOT NULL,
	"total_wickets" integer DEFAULT 0 NOT NULL,
	"total_balls" integer DEFAULT 0 NOT NULL,
	"wide_runs" integer DEFAULT 0 NOT NULL,
	"no_ball_runs" integer DEFAULT 0 NOT NULL,
	"bye_runs" integer DEFAULT 0 NOT NULL,
	"leg_bye_runs" integer DEFAULT 0 NOT NULL,
	"status" "innings_status" DEFAULT 'UPCOMING' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "player_match_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" uuid NOT NULL,
	"player_id" uuid NOT NULL,
	"team" "team" NOT NULL,
	"batting_order" integer,
	"runs" integer DEFAULT 0 NOT NULL,
	"balls_faced" integer DEFAULT 0 NOT NULL,
	"dots_faced" integer DEFAULT 0 NOT NULL,
	"fours" integer DEFAULT 0 NOT NULL,
	"sixes" integer DEFAULT 0 NOT NULL,
	"dismissal_type" "dismissal_type",
	"wickets" integer DEFAULT 0 NOT NULL,
	"balls_bowled" integer DEFAULT 0 NOT NULL,
	"dots_bowled" integer DEFAULT 0 NOT NULL,
	"maidens" integer DEFAULT 0 NOT NULL,
	"runs_conceded" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "access_codes" ADD CONSTRAINT "access_codes_turf_id_turfs_id_fk" FOREIGN KEY ("turf_id") REFERENCES "public"."turfs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_codes" ADD CONSTRAINT "access_codes_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "balls" ADD CONSTRAINT "balls_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "balls" ADD CONSTRAINT "balls_innings_id_innings_id_fk" FOREIGN KEY ("innings_id") REFERENCES "public"."innings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "balls" ADD CONSTRAINT "balls_batsman_id_players_id_fk" FOREIGN KEY ("batsman_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "balls" ADD CONSTRAINT "balls_bowler_id_players_id_fk" FOREIGN KEY ("bowler_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "balls" ADD CONSTRAINT "balls_dismissed_player_id_players_id_fk" FOREIGN KEY ("dismissed_player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "balls" ADD CONSTRAINT "balls_fielder_id_players_id_fk" FOREIGN KEY ("fielder_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_turf_id_turfs_id_fk" FOREIGN KEY ("turf_id") REFERENCES "public"."turfs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_turf_id_turfs_id_fk" FOREIGN KEY ("turf_id") REFERENCES "public"."turfs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_man_of_the_match_player_id_players_id_fk" FOREIGN KEY ("man_of_the_match_player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_players" ADD CONSTRAINT "match_players_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_players" ADD CONSTRAINT "match_players_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "innings" ADD CONSTRAINT "innings_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "innings" ADD CONSTRAINT "innings_opening_striker_id_players_id_fk" FOREIGN KEY ("opening_striker_id") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "innings" ADD CONSTRAINT "innings_opening_non_striker_id_players_id_fk" FOREIGN KEY ("opening_non_striker_id") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "innings" ADD CONSTRAINT "innings_opening_bowler_id_players_id_fk" FOREIGN KEY ("opening_bowler_id") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "innings" ADD CONSTRAINT "innings_current_striker_id_players_id_fk" FOREIGN KEY ("current_striker_id") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "innings" ADD CONSTRAINT "innings_current_non_striker_id_players_id_fk" FOREIGN KEY ("current_non_striker_id") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "innings" ADD CONSTRAINT "innings_current_bowler_id_players_id_fk" FOREIGN KEY ("current_bowler_id") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_match_stats" ADD CONSTRAINT "player_match_stats_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_match_stats" ADD CONSTRAINT "player_match_stats_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_code_per_turf" ON "access_codes" USING btree ("turf_id","code");--> statement-breakpoint
CREATE INDEX "idx_balls_match" ON "balls" USING btree ("match_id");--> statement-breakpoint
CREATE INDEX "idx_balls_innings" ON "balls" USING btree ("innings_id");--> statement-breakpoint
CREATE INDEX "idx_balls_over" ON "balls" USING btree ("match_id","innings_id","over_number");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_phone" ON "users" USING btree ("phone");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_email" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_player_per_turf" ON "players" USING btree ("turf_id","name","phone");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_player_per_match" ON "match_players" USING btree ("match_id","player_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_innings_per_match" ON "innings" USING btree ("match_id","innings_number");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_player_match" ON "player_match_stats" USING btree ("match_id","player_id");