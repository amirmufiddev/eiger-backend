import { betterAuth, BetterAuthOptions } from 'better-auth';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { schema, getDbConnection } from './infrastructure/database';

export const authOptions: BetterAuthOptions = {
  appName: 'Eiger Adventure Land',
  basePath: '/auth',
  baseURL: process.env.BETTER_AUTH_URL!,
  secret: process.env.BETTER_AUTH_SECRET!,
  trustedOrigins: [process.env.BETTER_AUTH_URL!],
  database: drizzleAdapter(getDbConnection(process.env.DATABASE_URL), {
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
export const createAuth = betterAuth;
export const auth = createAuth(authOptions);
