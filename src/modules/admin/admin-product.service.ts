import {
  Injectable,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../../infrastructure/database/database.module';
import {
  products,
  transactionItems,
} from '../../infrastructure/database/schema';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as schema from '../../infrastructure/database/schema';

@Injectable()
export class AdminProductService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private db: PostgresJsDatabase<typeof schema>,
  ) {}

  async getProducts() {
    const productList = await this.db.select().from(products);
    return productList.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: parseFloat(p.price),
      costPrice: p.costPrice ? parseFloat(p.costPrice) : null,
      operationalCost: p.operationalCost ? parseFloat(p.operationalCost) : null,
      isActive: p.isActive === 1,
    }));
  }

  async createProduct(data: {
    name: string;
    price: number;
    description?: string;
    costPrice?: number;
    operationalCost?: number;
  }) {
    const [newProduct] = await this.db
      .insert(products)
      .values({
        name: data.name,
        description: data.description,
        price: data.price.toString(),
        costPrice: data.costPrice?.toString(),
        operationalCost: data.operationalCost?.toString(),
      })
      .returning();

    return {
      id: newProduct.id,
      name: newProduct.name,
      description: newProduct.description,
      price: parseFloat(newProduct.price),
      costPrice: newProduct.costPrice ? parseFloat(newProduct.costPrice) : null,
      operationalCost: newProduct.operationalCost
        ? parseFloat(newProduct.operationalCost)
        : null,
    };
  }

  async updateProduct(
    id: string,
    data: {
      name?: string;
      price?: number;
      description?: string;
      costPrice?: number;
      operationalCost?: number;
    },
  ) {
    const existing = await this.db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);
    if (existing.length === 0) {
      throw new NotFoundException('Product not found');
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (data.name !== undefined) updateData.name = data.name;
    if (data.price !== undefined) updateData.price = data.price.toString();
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.costPrice !== undefined)
      updateData.costPrice = data.costPrice.toString();
    if (data.operationalCost !== undefined)
      updateData.operationalCost = data.operationalCost.toString();

    const [updated] = await this.db
      .update(products)
      .set(updateData)
      .where(eq(products.id, id))
      .returning();

    return {
      id: updated.id,
      name: updated.name,
      description: updated.description,
      price: parseFloat(updated.price),
      costPrice: updated.costPrice ? parseFloat(updated.costPrice) : null,
      operationalCost: updated.operationalCost
        ? parseFloat(updated.operationalCost)
        : null,
    };
  }

  async deleteProduct(id: string) {
    const existing = await this.db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);
    if (existing.length === 0) {
      throw new NotFoundException('Product not found');
    }

    const usedInTransactions = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(transactionItems)
      .where(eq(transactionItems.productId, id));

    if (usedInTransactions[0].count > 0) {
      await this.db
        .update(products)
        .set({ isActive: 0, updatedAt: new Date() })
        .where(eq(products.id, id));
      return {
        message:
          'Product deactivated (soft delete) due to existing transactions',
      };
    }

    await this.db.delete(products).where(eq(products.id, id));
    return { message: 'Product deleted' };
  }
}
