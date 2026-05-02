import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as Enums from './schema/enums.schema';
import * as Users from './schema/users.schema';
import * as Sessions from './schema/sessions.schema';
import * as Memberships from './schema/memberships.schema';
import * as Wallets from './schema/wallets.schema';
import * as Products from './schema/products.schema';
import * as PaymentMethods from './schema/payment-methods.schema';
import * as Transactions from './schema/transactions.schema';
import * as TransactionItems from './schema/transaction-items.schema';

export const schema: typeof Enums &
  typeof Users &
  typeof Sessions &
  typeof Memberships &
  typeof Wallets &
  typeof Products &
  typeof PaymentMethods &
  typeof Transactions &
  typeof TransactionItems = {
  ...Enums,
  ...Users,
  ...Sessions,
  ...Memberships,
  ...Wallets,
  ...Products,
  ...PaymentMethods,
  ...Transactions,
  ...TransactionItems,
};

export const getDbConnection = (connectionString?: string) => {
  if (!connectionString) {
    throw new Error('DATABASE_URL is not defined');
  }

  const client = postgres(connectionString);
  return drizzle(client, { schema });
};
