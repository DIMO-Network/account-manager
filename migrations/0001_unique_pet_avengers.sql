ALTER TABLE "counter" ADD COLUMN "serial_number" text NOT NULL;--> statement-breakpoint
ALTER TABLE "counter" ADD COLUMN "stripe_customer_id" text;--> statement-breakpoint
ALTER TABLE "counter" ADD COLUMN "stripe_subscription_id" text;--> statement-breakpoint
ALTER TABLE "counter" ADD COLUMN "subscription_status" text;--> statement-breakpoint
ALTER TABLE "counter" ADD COLUMN "plan_type" text;--> statement-breakpoint
ALTER TABLE "counter" ADD COLUMN "is_active" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "counter" ADD CONSTRAINT "counter_serial_number_unique" UNIQUE("serial_number");