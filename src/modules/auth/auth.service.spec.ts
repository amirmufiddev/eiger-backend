import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { DATABASE_CONNECTION } from '../../infrastructure/database/database.module';

jest.mock('../../infrastructure/database/schema/index', () => ({
  users: 'users',
  wallets: 'wallets',
  memberships: 'memberships',
  sessions: 'sessions',
}));

interface MockDbChain {
  from: jest.Mock;
  where: jest.Mock;
  limit: jest.Mock;
}

interface MockDb {
  select: jest.Mock;
  insert: jest.Mock;
  delete: jest.Mock;
}

describe('AuthService', () => {
  let service: AuthService;
  let mockDb: MockDb;

  beforeEach(async () => {
    mockDb = {
      select: jest.fn(),
      insert: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: DATABASE_CONNECTION,
          useValue: mockDb,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  const createChain = (resolvedValue: unknown[]): MockDbChain => {
    const chain: MockDbChain = {
      from: jest.fn(),
      where: jest.fn(),
      limit: jest.fn(),
    };
    chain.from.mockReturnValue(chain);
    chain.where.mockReturnValue(chain);
    chain.limit.mockResolvedValue(resolvedValue);
    return chain;
  };

  describe('register', () => {
    it('should create user with wallet and membership', async () => {
      const mockUser = {
        id: 'user-uuid',
        email: 'test@example.com',
        name: 'Test User',
        role: 'member' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      createChain([]);
      mockDb.select.mockReturnValue(createChain([]));

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockUser]),
        }),
      });

      const result = await service.register('test@example.com', 'Test User');

      expect(result.user.email).toBe('test@example.com');
      expect(result.user.name).toBe('Test User');
      expect(result.user.role).toBe('member');
      expect(result.token).toBeDefined();
    });

    it('should throw ConflictException if user exists', async () => {
      mockDb.select.mockReturnValue(
        createChain([{ email: 'test@example.com' }]),
      );

      await expect(
        service.register('test@example.com', 'Test User'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should return user and token', async () => {
      const mockUser = {
        id: 'user-uuid',
        email: 'test@example.com',
        name: 'Test User',
        role: 'member' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.select.mockReturnValue(createChain([mockUser]));
      mockDb.insert.mockReturnValue({
        values: jest.fn().mockResolvedValue([]),
      });

      const result = await service.login('test@example.com');

      expect(result.user.email).toBe('test@example.com');
      expect(result.token).toBeDefined();
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockDb.select.mockReturnValue(createChain([]));

      await expect(service.login('nonexistent@example.com')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should delete session', async () => {
      mockDb.delete.mockReturnValue({
        where: jest.fn().mockResolvedValue([]),
      });

      const result = await service.logout('some-token');

      expect(result.message).toBe('Logged out successfully');
    });
  });

  describe('getProfile', () => {
    it('should return user profile for valid token', async () => {
      const mockUser = {
        id: 'user-uuid',
        email: 'test@example.com',
        name: 'Test User',
        role: 'member' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const mockSession = {
        id: 'session-uuid',
        userId: 'user-uuid',
        token: 'valid-token',
        expiresAt: new Date(Date.now() + 86400000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.select
        .mockReturnValueOnce(createChain([mockSession]))
        .mockReturnValueOnce(createChain([mockUser]));

      const result = await service.getProfile('valid-token');

      expect(result.email).toBe('test@example.com');
      expect(result.name).toBe('Test User');
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      mockDb.select.mockReturnValue(createChain([]));

      await expect(service.getProfile('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for expired session', async () => {
      const mockSession = {
        id: 'session-uuid',
        userId: 'user-uuid',
        token: 'expired-token',
        expiresAt: new Date(Date.now() - 86400000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.select.mockReturnValue(createChain([mockSession]));
      mockDb.delete.mockReturnValue({
        where: jest.fn().mockResolvedValue([]),
      });

      await expect(service.getProfile('expired-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
