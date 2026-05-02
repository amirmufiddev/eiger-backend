import { Injectable, Inject } from '@nestjs/common';
import { AfterCreate, DatabaseHook } from '@thallesp/nestjs-better-auth';
import { DATABASE_CONNECTION } from '../../infrastructure/database/database.module';
import { schema } from '../../infrastructure/database/index';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

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

    await this.db.insert(schema.wallets).values({
      userId,
      balance: '0',
    });

    await this.db.insert(schema.memberships).values({
      userId,
      tier: 'bronze',
      points: 0,
    });
  }
}
