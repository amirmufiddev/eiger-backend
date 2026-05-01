import {
  Injectable,
  Inject,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../../infrastructure/database/database.module';
import {
  users,
  accounts,
  sessions,
  wallets,
  memberships,
} from '../../infrastructure/database/schema';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as schema from '../../infrastructure/database/schema';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private db: PostgresJsDatabase<typeof schema>,
  ) {}

  private hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  async register(email: string, password: string, name?: string) {
    const existingUser = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      throw new BadRequestException('Email already registered');
    }

    const hashedPassword = this.hashPassword(password);

    const result = await this.db.transaction(async (tx) => {
      const [newUser] = await tx
        .insert(users)
        .values({
          email,
          name,
          role: 'member',
        })
        .returning();

      await tx.insert(accounts).values({
        userId: newUser.id,
        accountId: newUser.id,
        providerId: 'credential',
        password: hashedPassword,
      });

      await tx.insert(wallets).values({
        userId: newUser.id,
        balance: '0',
      });

      await tx.insert(memberships).values({
        userId: newUser.id,
        tier: 'bronze',
        points: 0,
      });

      return newUser;
    });

    return {
      id: result.id,
      email: result.email,
      name: result.name,
      role: result.role,
    };
  }

  async login(email: string, password: string) {
    const hashedPassword = this.hashPassword(password);

    const userResult = await this.db
      .select({
        user: users,
        account: accounts,
      })
      .from(users)
      .innerJoin(accounts, eq(users.id, accounts.userId))
      .where(eq(users.email, email))
      .limit(1);

    if (userResult.length === 0) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { user, account } = userResult[0];

    if (account.password !== hashedPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.db.insert(sessions).values({
      userId: user.id,
      token,
      expiresAt,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
      expiresAt,
    };
  }

  async logout(token: string) {
    await this.db.delete(sessions).where(eq(sessions.token, token));
    return { success: true };
  }

  async getMe(userId: string) {
    const userResult = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userResult.length === 0) {
      throw new UnauthorizedException('User not found');
    }

    const user = userResult[0];
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }
}
