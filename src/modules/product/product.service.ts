import { Injectable, Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../../infrastructure/database/database.module';
import { products } from '../../infrastructure/database/schema';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as schema from '../../infrastructure/database/schema';

@Injectable()
export class ProductService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private db: PostgresJsDatabase<typeof schema>,
  ) {}

  async getProducts() {
    const productList = await this.db
      .select()
      .from(products)
      .where(eq(products.isActive, 1));

    return productList.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: parseFloat(p.price),
      costPrice: p.costPrice ? parseFloat(p.costPrice) : null,
      operationalCost: p.operationalCost ? parseFloat(p.operationalCost) : null,
    }));
  }

  async getProductById(id: string) {
    const productResult = await this.db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (productResult.length === 0) {
      return null;
    }

    const p = productResult[0];
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      price: parseFloat(p.price),
      costPrice: p.costPrice ? parseFloat(p.costPrice) : null,
      operationalCost: p.operationalCost ? parseFloat(p.operationalCost) : null,
    };
  }
}
