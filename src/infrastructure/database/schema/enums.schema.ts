import { pgEnum } from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('user_role', ['admin', 'member']);
export const transactionStatusEnum = pgEnum('transaction_status', [
  'pending',
  'completed',
  'failed',
  'cancelled',
]);
