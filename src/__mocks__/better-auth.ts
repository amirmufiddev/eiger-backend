export const betterAuth = jest.fn().mockReturnValue({
  appName: 'Eiger Adventure Land',
  basePath: '/auth',
  baseURL: 'http://localhost:3000',
  secret: 'mock-secret',
  trustedOrigins: ['http://localhost:3000'],
  databaseHooks: {},
  database: {},
  emailAndPassword: { enabled: true },
  session: { expiresIn: 60 * 60 * 24 * 30 },
  plugins: [],
});
export type Auth = ReturnType<typeof betterAuth>;
