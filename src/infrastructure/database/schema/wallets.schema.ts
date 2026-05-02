import { pgTable, uuid, numeric, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users.schema';

export const wallets = pgTable('wallets', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' })
    .unique(),
  balance: numeric('balance', { precision: 15, scale: 2 })
    .default('0')
    .notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

export const walletsRelations = relations(wallets, ({ one }) => ({
  user: one(users, { fields: [wallets.userId], references: [users.id] }),
}));
