import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../../infrastructure/database/database.module';
import { memberships, users } from '../../infrastructure/database/schema';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as schema from '../../infrastructure/database/schema';

@Injectable()
export class AdminMembershipService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private db: PostgresJsDatabase<typeof schema>,
  ) {}

  async getMemberships() {
    const membershipList = await this.db
      .select({
        membership: memberships,
        user: {
          id: users.id,
          email: users.email,
          name: users.name,
        },
      })
      .from(memberships)
      .innerJoin(users, eq(memberships.userId, users.id));

    return membershipList.map((m) => ({
      id: m.membership.id,
      userId: m.membership.userId,
      tier: m.membership.tier,
      points: m.membership.points,
      user: m.user,
    }));
  }

  async getMembershipById(id: string) {
    const result = await this.db
      .select({
        membership: memberships,
        user: {
          id: users.id,
          email: users.email,
          name: users.name,
        },
      })
      .from(memberships)
      .innerJoin(users, eq(memberships.userId, users.id))
      .where(eq(memberships.id, id))
      .limit(1);

    if (result.length === 0) {
      throw new NotFoundException('Membership not found');
    }

    const m = result[0];
    return {
      id: m.membership.id,
      userId: m.membership.userId,
      tier: m.membership.tier,
      points: m.membership.points,
      user: m.user,
    };
  }

  async createMembership(data: {
    userId: string;
    tier: string;
    points: number;
  }) {
    const userExists = await this.db
      .select()
      .from(users)
      .where(eq(users.id, data.userId))
      .limit(1);
    if (userExists.length === 0) {
      throw new NotFoundException('User not found');
    }

    const existingMembership = await this.db
      .select()
      .from(memberships)
      .where(eq(memberships.userId, data.userId))
      .limit(1);

    if (existingMembership.length > 0) {
      throw new ConflictException('User already has a membership');
    }

    const [newMembership] = await this.db
      .insert(memberships)
      .values({
        userId: data.userId,
        tier: data.tier,
        points: data.points,
      })
      .returning();

    return {
      id: newMembership.id,
      userId: newMembership.userId,
      tier: newMembership.tier,
      points: newMembership.points,
    };
  }

  async updateMembership(id: string, data: { tier?: string; points?: number }) {
    const existing = await this.db
      .select()
      .from(memberships)
      .where(eq(memberships.id, id))
      .limit(1);
    if (existing.length === 0) {
      throw new NotFoundException('Membership not found');
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (data.tier !== undefined) updateData.tier = data.tier;
    if (data.points !== undefined) updateData.points = data.points;

    const [updated] = await this.db
      .update(memberships)
      .set(updateData)
      .where(eq(memberships.id, id))
      .returning();

    return {
      id: updated.id,
      userId: updated.userId,
      tier: updated.tier,
      points: updated.points,
    };
  }

  async deleteMembership(id: string) {
    const existing = await this.db
      .select()
      .from(memberships)
      .where(eq(memberships.id, id))
      .limit(1);
    if (existing.length === 0) {
      throw new NotFoundException('Membership not found');
    }

    await this.db.delete(memberships).where(eq(memberships.id, id));
    return { message: 'Membership deleted' };
  }
}
