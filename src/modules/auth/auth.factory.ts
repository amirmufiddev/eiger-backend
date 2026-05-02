import { Auth, betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin as adminPlugin } from 'better-auth/plugins';
import { drizzle } from 'drizzle-orm/postgres-js';
import { ConfigService } from '@nestjs/config';

import {
  users,
  sessions,
  memberships,
} from '../../infrastructure/database/schema/index';

import postgres from 'postgres';

export interface AuthFactoryDeps {
  configService: ConfigService;
}

export function createAuth(deps: AuthFactoryDeps): Auth<any> {
  const { configService } = deps;

  const databaseUrl = configService.get<string>('DATABASE_URL')!;
  const sql = postgres(databaseUrl);
  const db = drizzle(sql);

  return betterAuth({
    appName: 'Eiger Adventure Land',
    basePath: '/auth',
    baseURL:
      configService.get<string>('FRONTEND_URL') || 'http://localhost:3000',
    secret: configService.get<string>('BETTER_AUTH_SECRET')!,
    trustedOrigins: [
      configService.get<string>('FRONTEND_URL') || 'http://localhost:3000',
    ],
    databaseHooks: {},
    database: drizzleAdapter(db, {
      provider: 'pg',
      schema: {
        users,
        sessions,
        memberships,
      },
    }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      minPasswordLength: 8,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 30, // 30 days
      updateAge: 60 * 60 * 24, // 1 day
    },
    plugins: [adminPlugin()],
  });
}
