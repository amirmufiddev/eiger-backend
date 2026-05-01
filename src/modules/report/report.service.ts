import { Injectable, Inject } from '@nestjs/common';
import { eq, sql, desc } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../../infrastructure/database/database.module';
import {
  transactions,
  transactionItems,
  products,
  paymentMethods,
} from '../../infrastructure/database/schema';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as schema from '../../infrastructure/database/schema';

@Injectable()
export class ReportService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private db: PostgresJsDatabase<typeof schema>,
  ) {}

  async getTransactions(userId: string, userRole: string) {
    let query = this.db
      .select({
        id: transactions.id,
        userId: transactions.userId,
        status: transactions.status,
        total: transactions.total,
        createdAt: transactions.createdAt,
        paymentMethod: {
          id: paymentMethods.id,
          code: paymentMethods.code,
          name: paymentMethods.name,
        },
      })
      .from(transactions)
      .innerJoin(
        paymentMethods,
        eq(transactions.paymentMethodId, paymentMethods.id),
      )
      .orderBy(desc(transactions.createdAt));

    if (userRole !== 'admin') {
      query = query.where(eq(transactions.userId, userId)) as typeof query;
    }

    const result = await query;

    return result.map((t) => ({
      id: t.id,
      userId: t.userId,
      status: t.status,
      total: parseFloat(t.total),
      createdAt: t.createdAt,
      paymentMethod: t.paymentMethod,
    }));
  }

  async getPnL(userId: string, userRole: string) {
    const baseCondition =
      userRole === 'admin' ? sql`1=1` : sql`${transactions.userId} = ${userId}`;

    const result = await this.db
      .select({
        totalRevenue: sql<string>`COALESCE(SUM(${transactionItems.unitPrice}::numeric * ${transactionItems.qty}), 0)`,
        totalCost: sql<string>`COALESCE(SUM(COALESCE(${products.costPrice}::numeric, 0) * ${transactionItems.qty}), 0)`,
        totalOperationalCost: sql<string>`COALESCE(SUM(COALESCE(${products.operationalCost}::numeric, 0) * ${transactionItems.qty}), 0)`,
        transactionCount: sql<number>`COUNT(DISTINCT ${transactions.id})`,
      })
      .from(transactions)
      .innerJoin(
        transactionItems,
        eq(transactions.id, transactionItems.transactionId),
      )
      .innerJoin(products, eq(transactionItems.productId, products.id))
      .where(sql`${transactions.status} = 'completed' AND ${baseCondition}`);

    const data = result[0];
    const revenue = parseFloat(data.totalRevenue);
    const cost = parseFloat(data.totalCost);
    const operationalCost = parseFloat(data.totalOperationalCost);
    const grossProfit = revenue - cost;
    const netProfit = grossProfit - operationalCost;
    const marginPercent = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

    return {
      revenue,
      cost,
      operationalCost,
      grossProfit,
      netProfit,
      marginPercent: Math.round(marginPercent * 100) / 100,
      transactionCount: data.transactionCount,
    };
  }
}
