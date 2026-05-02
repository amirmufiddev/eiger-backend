import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { roleEnum } from './enums.schema';
import { memberships } from './memberships.schema';
import { wallets } from './wallets.schema';
import { sessions } from './sessions.schema';
import { transactions } from './transactions.schema';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  role: roleEnum('role').default('member').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  membership: one(memberships, {
    fields: [users.id],
    references: [memberships.userId],
  }),
  wallet: one(wallets, { fields: [users.id], references: [wallets.userId] }),
  transactions: many(transactions),
  sessions: many(sessions),
}));
