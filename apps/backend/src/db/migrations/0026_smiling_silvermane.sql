DO $$ BEGIN
    CREATE TYPE "public"."plan" AS ENUM('BASIC', 'PRO', 'PREMIUM');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE TYPE "public"."role" AS ENUM('SUPER_ADMIN', 'TURF_ADMIN', 'SCORER', 'PLAYER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE TYPE "public"."subscription_status" AS ENUM('TRIAL', 'ACTIVE', 'EXPIRED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE TYPE "public"."turf_verification_status" AS ENUM('PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE TYPE "public"."user_status" AS ENUM('ACTIVE', 'BLOCKED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "phone" varchar(20),
        "email" varchar(255),
        "password_hash" varchar(255),
        "name" varchar(255) NOT NULL,
        "avatar_url" varchar(500),
        "is_phone_verified" boolean DEFAULT false,
        "is_email_verified" boolean DEFAULT false,
        "status" "user_status" DEFAULT 'ACTIVE',
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now(),
        CONSTRAINT "users_phone_unique" UNIQUE("phone"),
        CONSTRAINT "users_email_unique" UNIQUE("email")
    );
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE TABLE "roles" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "name" "role" NOT NULL,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now(),
        CONSTRAINT "roles_name_unique" UNIQUE("name")
    );
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE TABLE "user_roles" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "user_id" uuid NOT NULL,
        "role_id" uuid NOT NULL,
        "turf_id" uuid,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
    );
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE TABLE "permissions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "name" varchar(100) NOT NULL,
        "description" varchar(255),
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now(),
        CONSTRAINT "permissions_name_unique" UNIQUE("name")
    );
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE TABLE "role_permissions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "role_id" uuid NOT NULL,
        "permission_id" uuid NOT NULL,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
    );
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE TABLE "plans" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "name" "plan" NOT NULL,
        "price_monthly" varchar(10),
        "price_yearly" varchar(10),
        "features_json" text,
        "is_active" boolean DEFAULT true,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now(),
        CONSTRAINT "plans_name_unique" UNIQUE("name")
    );
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE TABLE "subscriptions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "turf_id" uuid NOT NULL,
        "plan_id" uuid NOT NULL,
        "status" "subscription_status" DEFAULT 'TRIAL',
        "start_date" timestamp DEFAULT now(),
        "end_date" timestamp,
        "trial_ends_at" timestamp,
        "payment_provider" varchar(100),
        "payment_subscription_id" varchar(255),
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
    );
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "turfs" DROP CONSTRAINT IF EXISTS "turfs_email_unique";
EXCEPTION
    WHEN undefined_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "turfs" ALTER COLUMN "email" DROP NOT NULL;
EXCEPTION
    WHEN undefined_column THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "turfs" ALTER COLUMN "logo_url" SET DATA TYPE varchar(500);
EXCEPTION
    WHEN undefined_column THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "turfs" ADD COLUMN IF NOT EXISTS "slug" varchar(150) NOT NULL DEFAULT '';
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "turfs" ADD COLUMN IF NOT EXISTS "gst_number" varchar(20);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "turfs" ADD COLUMN IF NOT EXISTS "address_line_1" varchar(255);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "turfs" ADD COLUMN IF NOT EXISTS "city" varchar(100);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "turfs" ADD COLUMN IF NOT EXISTS "state" varchar(100);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "turfs" ADD COLUMN IF NOT EXISTS "country" varchar(100) DEFAULT 'India';
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "turfs" ADD COLUMN IF NOT EXISTS "pincode" varchar(10);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "turfs" ADD COLUMN IF NOT EXISTS "map_location" varchar(500);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "turfs" ADD COLUMN IF NOT EXISTS "verification_status" "turf_verification_status" DEFAULT 'PENDING';
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "turfs" ADD COLUMN IF NOT EXISTS "verified_at" timestamp;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "turfs" ADD COLUMN IF NOT EXISTS "verified_by" uuid;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "turfs" ADD COLUMN IF NOT EXISTS "subscription_status" "subscription_status" DEFAULT 'TRIAL';
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "matches" ADD COLUMN IF NOT EXISTS "active_scorer_id" uuid;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "matches" ADD COLUMN IF NOT EXISTS "scorer_session_id" uuid;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "matches" ADD COLUMN IF NOT EXISTS "lock_expires_at" timestamp;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_turf_id_turfs_id_fk" FOREIGN KEY ("turf_id") REFERENCES "public"."turfs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_turf_id_turfs_id_fk" FOREIGN KEY ("turf_id") REFERENCES "public"."turfs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "turfs" DROP COLUMN IF EXISTS "password";
EXCEPTION
    WHEN undefined_column THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "turfs" DROP COLUMN IF EXISTS "address";
EXCEPTION
    WHEN undefined_column THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "permissions" ADD COLUMN IF NOT EXISTS "description" varchar(255);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "price_monthly" varchar(10);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "price_yearly" varchar(10);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "features_json" text;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "status" "subscription_status" DEFAULT 'TRIAL';
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "start_date" timestamp DEFAULT now();
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "end_date" timestamp;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "trial_ends_at" timestamp;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "payment_provider" varchar(100);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "payment_subscription_id" varchar(255);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;--> statement-breakpoint