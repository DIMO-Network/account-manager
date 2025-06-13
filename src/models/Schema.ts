import { boolean, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// This file defines the structure of your database tables using the Drizzle ORM.

// To modify the database schema:
// 1. Update this file with your desired changes.
// 2. Generate a new migration by running: `npm run db:generate`

// The generated migration file will reflect your schema changes.
// The migration is automatically applied during the next database interaction,
// so there's no need to run it manually or restart the Next.js server.

export const deviceSubscriptionSchema = pgTable('device_subscriptions', {
  id: serial('id').primaryKey(),
  serialNumber: text('serial_number').notNull().unique(),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  subscriptionStatus: text('subscription_status'), // active, inactive, canceled, etc.
  planType: text('plan_type'), // basic, premium, etc.
  isActive: boolean('is_active').default(false),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});
