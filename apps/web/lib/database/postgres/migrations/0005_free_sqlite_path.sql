ALTER TABLE "connections" ADD COLUMN "path" text;
ALTER TABLE "connections" ALTER COLUMN "host" DROP NOT NULL;
ALTER TABLE "connections" ALTER COLUMN "port" DROP NOT NULL;
