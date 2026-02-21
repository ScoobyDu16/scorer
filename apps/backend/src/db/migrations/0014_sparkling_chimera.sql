ALTER TABLE "innings" ADD COLUMN "opening_striker_id" uuid;--> statement-breakpoint
ALTER TABLE "innings" ADD COLUMN "opening_non_striker_id" uuid;--> statement-breakpoint
ALTER TABLE "innings" ADD CONSTRAINT "innings_opening_striker_id_players_id_fk" FOREIGN KEY ("opening_striker_id") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "innings" ADD CONSTRAINT "innings_opening_non_striker_id_players_id_fk" FOREIGN KEY ("opening_non_striker_id") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;