ALTER TABLE "matches" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "matches" ALTER COLUMN "status" SET DEFAULT 'UPCOMING'::text;--> statement-breakpoint
DROP TYPE "public"."match_status";--> statement-breakpoint
CREATE TYPE "public"."match_status" AS ENUM('UPCOMING', 'LIVE', 'COMPLETED');--> statement-breakpoint
ALTER TABLE "matches" ALTER COLUMN "status" SET DEFAULT 'UPCOMING'::"public"."match_status";--> statement-breakpoint
ALTER TABLE "matches" ALTER COLUMN "status" SET DATA TYPE "public"."match_status" USING "status"::"public"."match_status";--> statement-breakpoint
ALTER TABLE "innings" ADD COLUMN "total_balls" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "innings" DROP COLUMN "total_overs";