import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUserData {
  id: string;
  email: string;
  name: string | null;
  role: 'admin' | 'member';
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): CurrentUserData => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user: CurrentUserData }>();
    return request.user;
  },
);
