// E2e tests for auth module - mock auth module to avoid ESM/CJS conflict
// The real auth module chain (better-auth ESM) cannot load with supertest (CJS) in Jest

jest.mock('../src/modules/auth/auth.module', () => ({
  AuthModule: {
    forRootAsync: jest.fn().mockReturnValue({ module: jest.fn() }),
  },
}));

jest.mock('../src/modules/auth/auth.hook', () => ({
  AuthHooks: jest.fn().mockImplementation(function () {
    return { onUserCreated: jest.fn() };
  }),
}));

jest.mock('@thallesp/nestjs-better-auth', () => ({
  AuthModule: {
    forRootAsync: jest.fn().mockReturnValue({ module: jest.fn() }),
  },
  AuthService: jest.fn(),
  AuthGuard: jest.fn(),
  AllowAnonymous: jest.fn(),
  Session: jest.fn(),
  UserSession: {},
}));

jest.mock('better-auth', () => ({
  betterAuth: jest.fn().mockReturnValue({
    appName: 'Eiger',
    basePath: '/auth',
  }),
}));

jest.mock('better-auth/adapters/drizzle', () => ({
  drizzleAdapter: jest.fn(),
}));

jest.mock('better-auth/plugins', () => ({
  admin: jest.fn(),
}));

import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DATABASE_CONNECTION } from '../src/infrastructure/database/database.module';
import { sessions, users } from '../src/infrastructure/database/index';
import { like } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as schema from '../src/infrastructure/database/index';
import type { Agent } from 'supertest';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let db: PostgresJsDatabase<typeof schema>;
  let agent: Agent;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    db =
      moduleFixture.get<PostgresJsDatabase<typeof schema>>(DATABASE_CONNECTION);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    agent = request.agent(app.getHttpServer());
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  afterEach(async () => {
    if (db) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-member-access
      await db.delete(sessions).where(like(sessions.userId, 'e2e_%'));
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-member-access
      await db.delete(users).where(like(users.email, 'e2e_%'));
    }
  });

  describe('/api/auth/register (POST)', () => {
    it('should return 201 for valid registration request', () => {
      return agent
        .post('/api/auth/register')
        .send({
          email: 'e2e_test@example.com',
          name: 'E2E Test User',
          password: 'password123',
        })
        .expect(201);
    });

    it('should return 409 for duplicate email', () => {
      return agent
        .post('/api/auth/register')
        .send({
          email: 'e2e_test_dup@example.com',
          name: 'E2E Test User',
          password: 'password123',
        })
        .expect(201)
        .then(() =>
          agent
            .post('/api/auth/register')
            .send({
              email: 'e2e_test_dup@example.com',
              name: 'E2E Test User 2',
              password: 'password456',
            })
            .expect(409),
        );
    });

    it('should return 400 for invalid email', () => {
      return agent
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          name: 'E2E Test User',
          password: 'password123',
        })
        .expect(400);
    });
  });

  describe('/api/auth/login (POST)', () => {
    it('should return 200 for valid credentials', () => {
      return agent
        .post('/api/auth/login')
        .send({
          email: 'e2e_login@example.com',
          password: 'password123',
        })
        .expect(200);
    });

    it('should return 401 for non-existent user', () => {
      return agent
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
        .expect(401);
    });
  });

  describe('/api/auth/logout (POST)', () => {
    it('should return 401 without session', () => {
      return agent.post('/api/auth/logout').expect(401);
    });
  });

  describe('/api/auth/profile (GET)', () => {
    it('should return 401 without session', () => {
      return agent.get('/api/auth/profile').expect(401);
    });
  });
});
