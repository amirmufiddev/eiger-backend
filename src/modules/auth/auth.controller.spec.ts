import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { UnauthorizedException } from '@nestjs/common';

const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
  logout: jest.fn(),
  getProfile: jest.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: AuthGuard,
          useValue: { canActivate: jest.fn().mockReturnValue(true) },
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<AuthController>(AuthController);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const dto = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      };
      const expected = {
        user: {
          id: 'uuid',
          email: 'test@example.com',
          name: 'Test User',
          role: 'member',
        },
        token: 'session-token',
      };

      mockAuthService.register.mockResolvedValue(expected);

      const result = await controller.register(dto);

      expect(result).toEqual(expected);
      expect(mockAuthService.register).toHaveBeenCalledWith(
        'test@example.com',
        'Test User',
      );
    });
  });

  describe('login', () => {
    it('should login user', async () => {
      const dto = { email: 'test@example.com', password: 'password123' };
      const expected = {
        user: {
          id: 'uuid',
          email: 'test@example.com',
          name: 'Test User',
          role: 'member',
        },
        token: 'session-token',
      };

      mockAuthService.login.mockResolvedValue(expected);

      const result = await controller.login(dto);

      expect(result).toEqual(expected);
      expect(mockAuthService.login).toHaveBeenCalledWith('test@example.com');
    });
  });

  describe('logout', () => {
    it('should logout user', async () => {
      const expected = { message: 'Logged out successfully' };
      mockAuthService.logout.mockResolvedValue(expected);

      const result = await controller.logout('Bearer valid-token');

      expect(result).toEqual(expected);
      expect(mockAuthService.logout).toHaveBeenCalledWith('valid-token');
    });

    it('should throw UnauthorizedException if no token provided', async () => {
      await expect(controller.logout('')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if invalid header format', async () => {
      await expect(controller.logout('InvalidFormat token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const expected = {
        id: 'uuid',
        email: 'test@example.com',
        name: 'Test User',
        role: 'member',
        createdAt: expect.any(Date) as Date,
      };
      mockAuthService.getProfile.mockResolvedValue(expected);

      const result = await controller.getProfile('Bearer valid-token');

      expect(result).toEqual(expected);
      expect(mockAuthService.getProfile).toHaveBeenCalledWith('valid-token');
    });

    it('should throw UnauthorizedException if no token provided', async () => {
      await expect(controller.getProfile('')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
