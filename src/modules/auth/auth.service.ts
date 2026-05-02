import { Injectable, Inject } from '@nestjs/common';
import { AfterCreate, DatabaseHook } from '@thallesp/nestjs-better-auth';
import { DATABASE_CONNECTION } from '../../infrastructure/database/database.module';
import { wallets, memberships } from '../../infrastructure/database/schema/index';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as schema from '../../infrastructure/database/schema/index';

@Injectable()
@DatabaseHook()
export class AuthHooks {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  @AfterCreate('user')
  async onUserCreated(data: { user: { id: string } }) {
    const userId = data.user.id;

    await this.db.insert(wallets).values({
      userId,
      balance: '0',
    });

    await this.db.insert(memberships).values({
      userId,
      tier: 'bronze',
      points: 0,
    });
  }
}
