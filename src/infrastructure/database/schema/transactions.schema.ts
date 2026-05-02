import { pgTable, uuid, numeric, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users.schema';
import { paymentMethods } from './payment-methods.schema';
import { transactionItems } from './transaction-items.schema';
import { transactionStatusEnum } from './enums.schema';

export const transactions = pgTable('transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  paymentMethodId: uuid('payment_method_id')
    .notNull()
    .references(() => paymentMethods.id),
  status: transactionStatusEnum('status').default('pending').notNull(),
  total: numeric('total', { precision: 15, scale: 2 }).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

export const transactionsRelations = relations(
  transactions,
  ({ one, many }) => ({
    user: one(users, {
      fields: [transactions.userId],
      references: [users.id],
    }),
    paymentMethod: one(paymentMethods, {
      fields: [transactions.paymentMethodId],
      references: [paymentMethods.id],
    }),
    items: many(transactionItems),
  }),
);
