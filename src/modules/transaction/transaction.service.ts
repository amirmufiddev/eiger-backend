import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { eq, sql, and, inArray } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../../infrastructure/database/database.module';
import {
  transactions,
  transactionItems,
  wallets,
  memberships,
  products,
  paymentMethods,
} from '../../infrastructure/database/schema';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as schema from '../../infrastructure/database/schema';
import { GateGateway } from '../realtime/gate.gateway';

interface CheckoutItem {
  id: string;
  qty: number;
}

@Injectable()
export class TransactionService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private db: PostgresJsDatabase<typeof schema>,
    private gateGateway: GateGateway,
  ) {}

  async checkout(
    userId: string,
    userRole: string,
    productItems: CheckoutItem[],
    paymentMethodId: string,
  ) {
    if (userRole === 'admin') {
      throw new ForbiddenException('Admin cannot perform checkout');
    }

    if (!productItems || productItems.length === 0) {
      throw new BadRequestException('No products selected');
    }

    const paymentMethod = await this.db
      .select()
      .from(paymentMethods)
      .where(eq(paymentMethods.id, paymentMethodId))
      .limit(1);

    if (paymentMethod.length === 0) {
      throw new NotFoundException('Payment method not found');
    }

    const productIds = productItems.map((p) => p.id);
    const productList = await this.db
      .select()
      .from(products)
      .where(and(inArray(products.id, productIds), eq(products.isActive, 1)));

    if (productList.length !== productIds.length) {
      throw new BadRequestException(
        'One or more products not found or inactive',
      );
    }

    const productMap = new Map(productList.map((p) => [p.id, p]));

    let total = 0;
    const items: { productId: string; qty: number; unitPrice: number }[] = [];

    for (const item of productItems) {
      const product = productMap.get(item.id);
      if (!product) {
        throw new BadRequestException(`Product ${item.id} not found`);
      }
      const unitPrice = parseFloat(product.price);
      total += unitPrice * item.qty;
      items.push({ productId: item.id, qty: item.qty, unitPrice });
    }

    const result = await this.db.transaction(async (tx) => {
      const walletResult = await tx
        .select()
        .from(wallets)
        .where(eq(wallets.userId, userId))
        .for('update');

      if (walletResult.length === 0) {
        throw new NotFoundException('Wallet not found');
      }

      const currentBalance = parseFloat(walletResult[0].balance);
      if (currentBalance < total) {
        throw new BadRequestException('Insufficient balance');
      }

      await tx
        .update(wallets)
        .set({
          balance: sql`${wallets.balance} - ${total}`,
          updatedAt: new Date(),
        })
        .where(eq(wallets.userId, userId));

      const [newTransaction] = await tx
        .insert(transactions)
        .values({
          userId,
          paymentMethodId,
          status: 'completed',
          total: total.toString(),
        })
        .returning();

      for (const item of items) {
        await tx.insert(transactionItems).values({
          transactionId: newTransaction.id,
          productId: item.productId,
          qty: item.qty,
          unitPrice: item.unitPrice.toString(),
        });
      }

      const pointsEarned = Math.floor(total / 10000);
      if (pointsEarned > 0) {
        await tx
          .update(memberships)
          .set({
            points: sql`${memberships.points} + ${pointsEarned}`,
            updatedAt: new Date(),
          })
          .where(eq(memberships.userId, userId));
      }

      return newTransaction;
    });

    this.gateGateway.emitGateOpen({
      userId,
      transactionId: result.id,
      productIds: items.map((i) => i.productId),
    });

    return {
      transactionId: result.id,
      status: result.status,
      total: parseFloat(result.total),
    };
  }

  async changePaymentMethod(
    transactionId: string,
    userId: string,
    userRole: string,
    newPaymentMethodId: string,
  ) {
    const txResult = await this.db
      .select()
      .from(transactions)
      .where(eq(transactions.id, transactionId))
      .limit(1);

    if (txResult.length === 0) {
      throw new NotFoundException('Transaction not found');
    }

    const tx = txResult[0];

    if (userRole !== 'admin' && tx.userId !== userId) {
      throw new ForbiddenException('Cannot modify other user transaction');
    }

    if (tx.status === 'completed' || tx.status === 'cancelled') {
      throw new BadRequestException(
        'Cannot change payment method for completed or cancelled transaction',
      );
    }

    const paymentMethod = await this.db
      .select()
      .from(paymentMethods)
      .where(eq(paymentMethods.id, newPaymentMethodId))
      .limit(1);

    if (paymentMethod.length === 0) {
      throw new NotFoundException('Payment method not found');
    }

    const [updated] = await this.db
      .update(transactions)
      .set({
        paymentMethodId: newPaymentMethodId,
        updatedAt: new Date(),
      })
      .where(eq(transactions.id, transactionId))
      .returning();

    return {
      transactionId: updated.id,
      status: updated.status,
      paymentMethodId: updated.paymentMethodId,
    };
  }
}
