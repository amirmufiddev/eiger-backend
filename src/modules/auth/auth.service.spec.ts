jest.mock('@thallesp/nestjs-better-auth', () => ({
  DatabaseHook: jest.fn(() => (target: unknown) => target),
  AfterCreate: jest.fn(
    () => (_t: unknown, _k: string, d: PropertyDescriptor) => d,
  ),
}));

jest.mock('../../infrastructure/database/schema/index', () => ({
  wallets: 'wallets',
  memberships: 'memberships',
}));

import { Test, TestingModule } from '@nestjs/testing';
import { AuthHooks } from './auth.service';
import { DATABASE_CONNECTION } from '../../infrastructure/database/database.module';

describe('AuthHooks', () => {
  let hooks: AuthHooks;
  let mockDb: { insert: jest.Mock };

  beforeEach(async () => {
    const mockInsert = jest.fn().mockReturnValue({
      values: jest.fn().mockResolvedValue([]),
    });
    mockDb = { insert: mockInsert };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthHooks,
        {
          provide: DATABASE_CONNECTION,
          useValue: mockDb,
        },
      ],
    }).compile();

    hooks = module.get<AuthHooks>(AuthHooks);
  });

  describe('onUserCreated', () => {
    it('should create wallet and membership when user is created', async () => {
      await hooks.onUserCreated({ user: { id: 'user-uuid' } });

      expect(mockDb.insert).toHaveBeenCalledWith('wallets');
      expect(mockDb.insert).toHaveBeenCalledWith('memberships');
    });
  });
});
