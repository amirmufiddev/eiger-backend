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

describe('AuthService', () => {
  let service: AuthService;
  let mockDb: any;

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

  const setupSelectMock = (resolvedValue: unknown[]) => {
    const chain: any = {};
    chain.from = jest.fn().mockReturnValue(chain);
    chain.where = jest.fn().mockReturnValue(chain);
    chain.limit = jest.fn().mockResolvedValue(resolvedValue);
    mockDb.select.mockReturnValue(chain);
    return chain;
  };

  const setupDeleteMock = () => {
    mockDb.delete.mockReturnValue({
      where: jest.fn().mockResolvedValue([]),
    });
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

      setupSelectMock([]);
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
      setupSelectMock([{ email: 'test@example.com' }]);

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

      setupSelectMock([mockUser]);
      mockDb.insert.mockReturnValue({
        values: jest.fn().mockResolvedValue([]),
      });

      const result = await service.login('test@example.com');

      expect(result.user.email).toBe('test@example.com');
      expect(result.token).toBeDefined();
    });

    it('should throw UnauthorizedException if user not found', async () => {
      setupSelectMock([]);

      await expect(service.login('nonexistent@example.com')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should delete session', async () => {
      setupDeleteMock();

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

      // First call: session lookup
      const chain1: any = {};
      chain1.from = jest.fn().mockReturnValue(chain1);
      chain1.where = jest.fn().mockReturnValue(chain1);
      chain1.limit = jest.fn().mockResolvedValue([mockSession]);
      mockDb.select.mockReturnValueOnce(chain1);

      // Second call: user lookup
      const chain2: any = {};
      chain2.from = jest.fn().mockReturnValue(chain2);
      chain2.where = jest.fn().mockReturnValue(chain2);
      chain2.limit = jest.fn().mockResolvedValue([mockUser]);
      mockDb.select.mockReturnValueOnce(chain2);

      const result = await service.getProfile('valid-token');

      expect(result.email).toBe('test@example.com');
      expect(result.name).toBe('Test User');
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      const chain: any = {};
      chain.from = jest.fn().mockReturnValue(chain);
      chain.where = jest.fn().mockReturnValue(chain);
      chain.limit = jest.fn().mockResolvedValue([]);
      mockDb.select.mockReturnValue(chain);

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

      const chain: any = {};
      chain.from = jest.fn().mockReturnValue(chain);
      chain.where = jest.fn().mockReturnValue(chain);
      chain.limit = jest.fn().mockResolvedValue([mockSession]);
      mockDb.select.mockReturnValue(chain);
      mockDb.delete.mockReturnValue({
        where: jest.fn().mockResolvedValue([]),
      });

      await expect(service.getProfile('expired-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
