ALTER TABLE "innings" ADD COLUMN "current_striker_id" uuid;--> statement-breakpoint
ALTER TABLE "innings" ADD COLUMN "current_non_striker_id" uuid;--> statement-breakpoint
ALTER TABLE "innings" ADD CONSTRAINT "innings_current_striker_id_players_id_fk" FOREIGN KEY ("current_striker_id") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "innings" ADD CONSTRAINT "innings_current_non_striker_id_players_id_fk" FOREIGN KEY ("current_non_striker_id") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;