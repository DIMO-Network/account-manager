ALTER TABLE "device_subscriptions" ADD COLUMN "connection_id" text;--> statement-breakpoint
UPDATE "device_subscriptions" SET "connection_id" = "serial_number" WHERE "connection_id" IS NULL;--> statement-breakpoint
ALTER TABLE "device_subscriptions" ALTER COLUMN "connection_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "device_subscriptions" ADD CONSTRAINT "device_subscriptions_connection_id_unique" UNIQUE("connection_id");