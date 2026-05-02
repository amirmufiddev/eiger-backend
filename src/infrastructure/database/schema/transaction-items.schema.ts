import { pgTable, uuid, integer, numeric, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { transactions } from './transactions.schema';
import { products } from './products.schema';

export const transactionItems = pgTable('transaction_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  transactionId: uuid('transaction_id')
    .notNull()
    .references(() => transactions.id, { onDelete: 'cascade' }),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id),
  qty: integer('qty').notNull(),
  unitPrice: numeric('unit_price', { precision: 15, scale: 2 }).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

export const transactionItemsRelations = relations(
  transactionItems,
  ({ one }) => ({
    transaction: one(transactions, {
      fields: [transactionItems.transactionId],
      references: [transactions.id],
    }),
    product: one(products, {
      fields: [transactionItems.productId],
      references: [products.id],
    }),
  }),
);
