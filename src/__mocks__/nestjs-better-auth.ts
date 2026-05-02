export const AuthService = jest.fn().mockImplementation(() => ({
  api: {
    signUpEmail: jest.fn(),
    signInEmail: jest.fn(),
    signOut: jest.fn(),
  },
}));

export const AuthGuard = jest.fn().mockImplementation(() => ({
  canActivate: jest.fn().mockReturnValue(true),
}));

export const AllowAnonymous = jest.fn(
  () => (_target: unknown, _key?: string, descriptor?: PropertyDescriptor) =>
    descriptor,
);
export const OptionalAuth = jest.fn(
  () => (_target: unknown, _key?: string, descriptor?: PropertyDescriptor) =>
    descriptor,
);
export const Roles = jest.fn(
  () => (_target: unknown, _key?: string, descriptor?: PropertyDescriptor) =>
    descriptor,
);
export const OrgRoles = jest.fn(
  () => (_target: unknown, _key?: string, descriptor?: PropertyDescriptor) =>
    descriptor,
);
export const UserHasPermission = jest.fn(
  () => (_target: unknown, _key?: string, descriptor?: PropertyDescriptor) =>
    descriptor,
);
export const MemberHasPermission = jest.fn(
  () => (_target: unknown, _key?: string, descriptor?: PropertyDescriptor) =>
    descriptor,
);
export const Session = jest.fn();
export const Public = jest.fn(
  () => (_target: unknown, _key?: string, descriptor?: PropertyDescriptor) =>
    descriptor,
);
export const Optional = jest.fn(
  () => (_target: unknown, _key?: string, descriptor?: PropertyDescriptor) =>
    descriptor,
);
export const Hook = jest.fn(() => (target: unknown) => target);
export const DatabaseHook = jest.fn(() => (target: unknown) => target);
export const BeforeHook = jest.fn(
  () => (_target: unknown, _key?: string, descriptor?: PropertyDescriptor) =>
    descriptor,
);
export const AfterHook = jest.fn(
  () => (_target: unknown, _key?: string, descriptor?: PropertyDescriptor) =>
    descriptor,
);
export const BeforeCreate = jest.fn(
  () => (_target: unknown, _key?: string, descriptor?: PropertyDescriptor) =>
    descriptor,
);
export const AfterCreate = jest.fn(
  () => (_target: unknown, _key?: string, descriptor?: PropertyDescriptor) =>
    descriptor,
);
export const BeforeUpdate = jest.fn(
  () => (_target: unknown, _key?: string, descriptor?: PropertyDescriptor) =>
    descriptor,
);
export const AfterUpdate = jest.fn(
  () => (_target: unknown, _key?: string, descriptor?: PropertyDescriptor) =>
    descriptor,
);
export const BeforeDelete = jest.fn(
  () => (_target: unknown, _key?: string, descriptor?: PropertyDescriptor) =>
    descriptor,
);
export const AfterDelete = jest.fn(
  () => (_target: unknown, _key?: string, descriptor?: PropertyDescriptor) =>
    descriptor,
);
export type UserSession = {
  user: { id: string; email: string; name: string; role?: string };
  session: { id: string };
};
