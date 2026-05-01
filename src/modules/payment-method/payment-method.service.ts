import { Injectable, Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../../infrastructure/database/database.module';
import { paymentMethods } from '../../infrastructure/database/schema';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as schema from '../../infrastructure/database/schema';

@Injectable()
export class PaymentMethodService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private db: PostgresJsDatabase<typeof schema>,
  ) {}

  async getPaymentMethods() {
    const methods = await this.db
      .select()
      .from(paymentMethods)
      .where(eq(paymentMethods.isActive, 1));

    return methods.map((m) => ({
      id: m.id,
      code: m.code,
      name: m.name,
    }));
  }

  async getPaymentMethodById(id: string) {
    const result = await this.db
      .select()
      .from(paymentMethods)
      .where(eq(paymentMethods.id, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return {
      id: result[0].id,
      code: result[0].code,
      name: result[0].name,
    };
  }
}
