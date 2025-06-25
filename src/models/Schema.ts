import { relations } from 'drizzle-orm';
import { pgSchema, serial, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const accountsApiSchema = pgSchema('accounts_api');

export const subscriptionsSchema = accountsApiSchema.table('subscriptions', {
  id: uuid('id').primaryKey(),
  stripeId: text('stripe_id').notNull(),
  accountId: text('account_id').notNull(),
  stripeCustomerId: text('stripe_customer_id').notNull(),
  status: text('status').notNull(), // trialing, active, canceled, etc.
  currency: text('currency').notNull(),
  seatCount: serial('seat_count').notNull(),
  startedAt: timestamp('started_at', { mode: 'date', withTimezone: true }).notNull(),
  endedAt: timestamp('ended_at', { mode: 'date', withTimezone: true }),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
});

export const dataSourcesSchema = accountsApiSchema.table('data_sources', {
  id: uuid('id').primaryKey(),
  connectionId: text('connection_id').notNull(),
  connectionType: text('connection_type').notNull(), // "R1"
  connectionStatus: text('connection_status').notNull(), // "connected", "disconnected"
  pairedAt: timestamp('paired_at', { mode: 'date', withTimezone: true }),
  unpairedAt: timestamp('unpaired_at', { mode: 'date', withTimezone: true }),
  subscriptionId: uuid('subscription_id').references(() => subscriptionsSchema.id),
  vehicleTokenId: serial('vehicle_token_id'),
  trialEndDate: timestamp('trial_end_date', { mode: 'date', withTimezone: true }),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
});

// Define relationships
export const subscriptionRelations = relations(subscriptionsSchema, ({ many }) => ({
  dataSources: many(dataSourcesSchema),
}));

export const dataSourceRelations = relations(dataSourcesSchema, ({ one }) => ({
  subscription: one(subscriptionsSchema, {
    fields: [dataSourcesSchema.subscriptionId],
    references: [subscriptionsSchema.id],
  }),
}));
