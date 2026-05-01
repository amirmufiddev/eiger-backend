import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../../infrastructure/database/database.module';
import { wallets } from '../../infrastructure/database/schema';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as schema from '../../infrastructure/database/schema';

@Injectable()
export class WalletService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private db: PostgresJsDatabase<typeof schema>,
  ) {}

  async getWallet(userId: string) {
    const walletResult = await this.db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, userId))
      .limit(1);

    if (walletResult.length === 0) {
      throw new NotFoundException('Wallet not found');
    }

    return {
      id: walletResult[0].id,
      balance: parseFloat(walletResult[0].balance),
    };
  }

  async topUp(userId: string, amount: number) {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    const result = await this.db
      .update(wallets)
      .set({
        balance: sql`${wallets.balance} + ${amount}`,
        updatedAt: new Date(),
      })
      .where(eq(wallets.userId, userId))
      .returning();

    if (result.length === 0) {
      throw new NotFoundException('Wallet not found');
    }

    return {
      balance: parseFloat(result[0].balance),
    };
  }
}
