DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'teams'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'organizations'
    ) THEN
        EXECUTE 'ALTER TABLE "teams" RENAME TO "organizations"';
    END IF;
END $$;--> statement-breakpoint
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'team_members'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'organization_members'
    ) THEN
        EXECUTE 'ALTER TABLE "team_members" RENAME TO "organization_members"';
    END IF;
END $$;--> statement-breakpoint
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'organization_members' AND column_name = 'team_id'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'organization_members' AND column_name = 'organization_id'
    ) THEN
        EXECUTE 'ALTER TABLE "organization_members" RENAME COLUMN "team_id" TO "organization_id"';
    END IF;
END $$;--> statement-breakpoint
DROP INDEX IF EXISTS "teams_slug_unique";--> statement-breakpoint
DROP INDEX IF EXISTS "team_members_team_id_user_id_unique";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_team_members_team";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_team_members_user";--> statement-breakpoint
ALTER TABLE IF EXISTS "organizations" ADD COLUMN IF NOT EXISTS "metadata" text;--> statement-breakpoint
ALTER TABLE IF EXISTS "organization_members" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE IF EXISTS "organization_members" ALTER COLUMN "status" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE IF EXISTS "organization_members" ALTER COLUMN "joined_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE IF EXISTS "organization_members" ALTER COLUMN "joined_at" DROP NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "organizations_slug_unique" ON "organizations" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "organization_members_organization_id_user_id_unique" ON "organization_members" USING btree ("organization_id","user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_organization_members_organization" ON "organization_members" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_organization_members_user" ON "organization_members" USING btree ("user_id");
