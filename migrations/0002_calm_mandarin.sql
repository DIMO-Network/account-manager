CREATE TABLE "device_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"serial_number" text NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"subscription_status" text,
	"plan_type" text,
	"is_active" boolean DEFAULT false,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "device_subscriptions_serial_number_unique" UNIQUE("serial_number")
);
--> statement-breakpoint
ALTER TABLE "counter" DROP CONSTRAINT "counter_serial_number_unique";--> statement-breakpoint
ALTER TABLE "counter" DROP COLUMN "serial_number";--> statement-breakpoint
ALTER TABLE "counter" DROP COLUMN "stripe_customer_id";--> statement-breakpoint
ALTER TABLE "counter" DROP COLUMN "stripe_subscription_id";--> statement-breakpoint
ALTER TABLE "counter" DROP COLUMN "subscription_status";--> statement-breakpoint
ALTER TABLE "counter" DROP COLUMN "plan_type";--> statement-breakpoint
ALTER TABLE "counter" DROP COLUMN "is_active";