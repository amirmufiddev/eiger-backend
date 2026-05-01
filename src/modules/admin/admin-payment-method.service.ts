import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../../infrastructure/database/database.module';
import {
  paymentMethods,
  transactions,
} from '../../infrastructure/database/schema';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as schema from '../../infrastructure/database/schema';

@Injectable()
export class AdminPaymentMethodService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private db: PostgresJsDatabase<typeof schema>,
  ) {}

  async getPaymentMethods() {
    const methods = await this.db.select().from(paymentMethods);
    return methods.map((m) => ({
      id: m.id,
      code: m.code,
      name: m.name,
      isActive: m.isActive === 1,
    }));
  }

  async createPaymentMethod(data: { code: string; name: string }) {
    const existing = await this.db
      .select()
      .from(paymentMethods)
      .where(eq(paymentMethods.code, data.code))
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictException('Payment method code already exists');
    }

    const [newMethod] = await this.db
      .insert(paymentMethods)
      .values({
        code: data.code,
        name: data.name,
      })
      .returning();

    return {
      id: newMethod.id,
      code: newMethod.code,
      name: newMethod.name,
    };
  }

  async updatePaymentMethod(
    id: string,
    data: { code?: string; name?: string },
  ) {
    const existing = await this.db
      .select()
      .from(paymentMethods)
      .where(eq(paymentMethods.id, id))
      .limit(1);
    if (existing.length === 0) {
      throw new NotFoundException('Payment method not found');
    }

    if (data.code) {
      const codeExists = await this.db
        .select()
        .from(paymentMethods)
        .where(eq(paymentMethods.code, data.code))
        .limit(1);
      if (codeExists.length > 0 && codeExists[0].id !== id) {
        throw new ConflictException('Payment method code already exists');
      }
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (data.code !== undefined) updateData.code = data.code;
    if (data.name !== undefined) updateData.name = data.name;

    const [updated] = await this.db
      .update(paymentMethods)
      .set(updateData)
      .where(eq(paymentMethods.id, id))
      .returning();

    return {
      id: updated.id,
      code: updated.code,
      name: updated.name,
    };
  }

  async deletePaymentMethod(id: string) {
    const existing = await this.db
      .select()
      .from(paymentMethods)
      .where(eq(paymentMethods.id, id))
      .limit(1);
    if (existing.length === 0) {
      throw new NotFoundException('Payment method not found');
    }

    const usedInTransactions = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(transactions)
      .where(eq(transactions.paymentMethodId, id));

    if (usedInTransactions[0].count > 0) {
      await this.db
        .update(paymentMethods)
        .set({ isActive: 0, updatedAt: new Date() })
        .where(eq(paymentMethods.id, id));
      return {
        message:
          'Payment method deactivated (soft delete) due to existing transactions',
      };
    }

    await this.db.delete(paymentMethods).where(eq(paymentMethods.id, id));
    return { message: 'Payment method deleted' };
  }
}
