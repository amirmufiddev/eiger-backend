import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../../infrastructure/database/database.module';
import { memberships } from '../../infrastructure/database/schema';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as schema from '../../infrastructure/database/schema';

@Injectable()
export class MembershipService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private db: PostgresJsDatabase<typeof schema>,
  ) {}

  async getMembership(userId: string) {
    const membershipResult = await this.db
      .select()
      .from(memberships)
      .where(eq(memberships.userId, userId))
      .limit(1);

    if (membershipResult.length === 0) {
      throw new NotFoundException('Membership not found');
    }

    return {
      id: membershipResult[0].id,
      tier: membershipResult[0].tier,
      points: membershipResult[0].points,
    };
  }
}
