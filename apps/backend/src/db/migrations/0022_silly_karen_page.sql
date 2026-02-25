ALTER TABLE "innings" ALTER COLUMN "status" SET DEFAULT 'UPCOMING';--> statement-breakpoint
ALTER TABLE "innings" ADD COLUMN "wide_runs" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "innings" ADD COLUMN "no_ball_runs" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "innings" ADD COLUMN "bye_runs" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "innings" ADD COLUMN "leg_bye_runs" integer DEFAULT 0 NOT NULL;