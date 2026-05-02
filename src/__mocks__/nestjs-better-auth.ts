export class MockAuthModule {
  static forRootAsync() {
    return {
      module: MockAuthModule,
    };
  }
}
export const AuthModule = MockAuthModule;
export const AuthService = jest.fn();
export const AuthGuard = jest.fn();
export const AllowAnonymous = jest.fn();
export const OptionalAuth = jest.fn();
export const Roles = jest.fn();
export const OrgRoles = jest.fn();
export const UserHasPermission = jest.fn();
export const MemberHasPermission = jest.fn();
export const Session = jest.fn();
export const Hook = jest.fn();
export const DatabaseHook = jest.fn();
export const BeforeHook = jest.fn();
export const AfterHook = jest.fn();
export const BeforeCreate = jest.fn();
export const AfterCreate = jest.fn();
export const BeforeUpdate = jest.fn();
export const AfterUpdate = jest.fn();
export const BeforeDelete = jest.fn();
export const AfterDelete = jest.fn();
export type UserSession = {
  user: { id: string; email: string; name: string; role?: string };
  session: { id: string };
};
