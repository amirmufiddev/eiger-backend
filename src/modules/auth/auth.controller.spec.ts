// Controller test: instantiate directly without NestJS DI
// to avoid decorator compilation issues with jest.mock

const signUpEmail = jest.fn();
const signInEmail = jest.fn();
const signOut = jest.fn();

jest.mock('@thallesp/nestjs-better-auth', () => ({
  AuthService: function() { return { api: { signUpEmail, signInEmail, signOut } }; },
  AuthGuard: function() { return { canActivate: () => true }; },
  AllowAnonymous: function() { return function(_t: any, _k: any, d: any) { return d; }; },
  Session: function() { return function(_target: any, _key: string, index: number) {}; },
}));

jest.mock('@nestjs/swagger', () => ({
  ApiTags: function() { return function(t: any) { return t; }; },
  ApiOperation: function() { return function(_t: any, _k: any, d: any) { return d; }; },
  ApiResponse: function() { return function(_t: any, _k: any, d: any) { return d; }; },
  ApiBearerAuth: function() { return function(_t: any, _k: any, d: any) { return d; }; },
}));

import { UnauthorizedException } from '@nestjs/common';
// Import controller class directly - bypass NestJS DI
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { AuthController } = require('./auth.controller');

describe('AuthController', () => {
  let controller: InstanceType<typeof AuthController>;

  beforeEach(() => {
    jest.clearAllMocks();
    const authService = {
      api: { signUpEmail, signInEmail, signOut },
    };
    controller = new AuthController(authService);
  });

  describe('register', () => {
    it('should call signUpEmail with correct params', async () => {
      const body = { email: 'test@example.com', name: 'Test User', password: 'pass123' };
      const expected = { user: { id: 'uuid' }, session: { token: 'tok' } };
      signUpEmail.mockResolvedValue(expected);
      const result = await controller.register(body);
      expect(result).toEqual(expected);
      expect(signUpEmail).toHaveBeenCalledWith({ body: { email: 'test@example.com', password: 'pass123', name: 'Test User' } });
    });
  });

  describe('login', () => {
    it('should call signInEmail with correct params', async () => {
      const body = { email: 'test@example.com', password: 'pass123' };
      const expected = { user: { id: 'uuid' }, session: { token: 'tok' } };
      signInEmail.mockResolvedValue(expected);
      const result = await controller.login(body);
      expect(result).toEqual(expected);
    });
  });

  describe('logout', () => {
    it('should call signOut', async () => {
      signOut.mockResolvedValue({ success: true });
      const result = await controller.logout('Bearer valid-token');
      expect(result).toEqual({ success: true });
    });

    it('should throw if no token', async () => {
      await expect(controller.logout('')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw if invalid format', async () => {
      await expect(controller.logout('Invalid token')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const session = { user: { id: 'uuid', email: 'a@b.com', name: 'Test', role: 'member', createdAt: new Date() } };
      const result = await controller.getProfile(session);
      expect(result.email).toBe('a@b.com');
      expect(result.name).toBe('Test');
    });
  });
});
