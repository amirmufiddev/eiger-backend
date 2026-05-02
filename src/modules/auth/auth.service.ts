import {
  Injectable,
  Inject,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { DATABASE_CONNECTION } from '../../infrastructure/database/database.module';
import {
  users,
  wallets,
  memberships,
  sessions,
} from '../../infrastructure/database/schema/index';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as schema from '../../infrastructure/database/schema/index';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private db: PostgresJsDatabase<typeof schema>,
  ) {}

  async register(email: string, name: string) {
    const existingUser = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      throw new ConflictException('User already exists');
    }

    const [newUser] = await this.db
      .insert(users)
      .values({
        email,
        name,
        role: 'member',
      })
      .returning();

    await this.db.insert(wallets).values({
      userId: newUser.id,
      balance: '0',
    });

    await this.db.insert(memberships).values({
      userId: newUser.id,
      tier: 'bronze',
      points: 0,
    });

    const token = randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await this.db.insert(sessions).values({
      userId: newUser.id,
      token,
      expiresAt,
    });

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
      token,
    };
  }

  async login(email: string) {
    const userResult = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (userResult.length === 0) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = userResult[0];
    const token = randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

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
    };
  }

  async logout(token: string) {
    await this.db.delete(sessions).where(eq(sessions.token, token));
    return { message: 'Logged out successfully' };
  }

  async getProfile(token: string) {
    const sessionResult = await this.db
      .select()
      .from(sessions)
      .where(eq(sessions.token, token))
      .limit(1);

    if (sessionResult.length === 0) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    const session = sessionResult[0];
    const now = new Date();
    if (session.expiresAt < now) {
      await this.db.delete(sessions).where(eq(sessions.id, session.id));
      throw new UnauthorizedException('Session expired');
    }

    const userResult = await this.db
      .select()
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    if (userResult.length === 0) {
      throw new NotFoundException('User not found');
    }

    const user = userResult[0];
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    };
  }
}
