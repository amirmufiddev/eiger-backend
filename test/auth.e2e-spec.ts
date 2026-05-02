import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Response } from 'supertest';
import { AppModule } from '../src/app.module';
import { DATABASE_CONNECTION } from '../src/infrastructure/database/database.module';
import { sessions, users } from '../src/infrastructure/database/schema/index';
import { like } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as schema from '../src/infrastructure/database/schema/index';
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
      await db.delete(sessions).where(like(sessions.userId, 'e2e_%'));
      await db.delete(users).where(like(users.email, 'e2e_%'));
    }
  });

  describe('/api/auth/register (POST)', () => {
    it('should register a new user', () => {
      return agent
        .post('/api/auth/register')
        .send({
          email: 'e2e_test@example.com',
          name: 'E2E Test User',
          password: 'password123',
        })
        .expect(201)
        .then((res: Response) => {
          const body = res.body as {
            user: Record<string, unknown>;
            token: string;
          };
          expect(body.user).toBeDefined();
          expect(body.user.email).toBe('e2e_test@example.com');
          expect(body.user.name).toBe('E2E Test User');
          expect(body.user.role).toBe('member');
          expect(body.token).toBeDefined();
        });
    });

    it('should return 409 if user already exists', () => {
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
    beforeEach(async () => {
      await agent.post('/api/auth/register').send({
        email: 'e2e_login_test@example.com',
        name: 'E2E Login Test',
        password: 'password123',
      });
    });

    it('should login existing user', () => {
      return agent
        .post('/api/auth/login')
        .send({
          email: 'e2e_login_test@example.com',
          password: 'password123',
        })
        .expect(200)
        .then((res: Response) => {
          const body = res.body as {
            user: Record<string, unknown>;
            token: string;
          };
          expect(body.user).toBeDefined();
          expect(body.user.email).toBe('e2e_login_test@example.com');
          expect(body.token).toBeDefined();
        });
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
    it('should logout with valid token', async () => {
      const registerRes = await agent.post('/api/auth/register').send({
        email: 'e2e_logout_test@example.com',
        name: 'E2E Logout Test',
        password: 'password123',
      });

      const body = registerRes.body as { token: string };
      const token = body.token;

      return agent
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .then((res: Response) => {
          const body = res.body as { message: string };
          expect(body.message).toBe('Logged out successfully');
        });
    });

    it('should return 401 without token', () => {
      return agent.post('/api/auth/logout').expect(401);
    });
  });

  describe('/api/auth/profile (GET)', () => {
    it('should get profile with valid token', async () => {
      const registerRes = await agent.post('/api/auth/register').send({
        email: 'e2e_profile_test@example.com',
        name: 'E2E Profile Test',
        password: 'password123',
      });

      const body = registerRes.body as { token: string };
      const token = body.token;

      return agent
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .then((res: Response) => {
          const profile = res.body as {
            email: string;
            name: string;
            role: string;
          };
          expect(profile.email).toBe('e2e_profile_test@example.com');
          expect(profile.name).toBe('E2E Profile Test');
          expect(profile.role).toBe('member');
        });
    });

    it('should return 401 without token', () => {
      return agent.get('/api/auth/profile').expect(401);
    });

    it('should return 401 with invalid token', () => {
      return agent
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});
