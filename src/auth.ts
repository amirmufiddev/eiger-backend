import { betterAuth, BetterAuthOptions } from 'better-auth';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { schema } from './infrastructure/database';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';

export interface AuthConfig {
  databaseUrl: string;
  baseURL: string;
  secret: string;
}

export const createAuthOptions = (config: AuthConfig): BetterAuthOptions => {
  const client = postgres(config.databaseUrl);
  const db = drizzle(client, { schema });

  return {
    appName: 'Eiger Adventure Land',
    basePath: '/auth',
    baseURL: config.baseURL,
    secret: config.secret,
    trustedOrigins: [config.baseURL],
    database: drizzleAdapter(db, {
      provider: 'pg',
      schema: {
        ...schema,
        user: schema.users,
        session: schema.sessions,
      },
    }),
    databaseHooks: {},
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      minPasswordLength: 8,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 30, // 30 days
      updateAge: 60 * 60 * 24, // 1 day
    },
  };
};

export const createAuth = betterAuth;
export const auth = createAuth(
  createAuthOptions({
    databaseUrl: process.env.DATABASE_URL!,
    baseURL: process.env.BETTER_AUTH_URL!,
    secret: process.env.BETTER_AUTH_SECRET!,
  }),
);
