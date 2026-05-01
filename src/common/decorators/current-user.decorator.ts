import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export interface CurrentUserData {
  id: string;
  email: string;
  name: string | null;
  role: 'admin' | 'member';
}

interface RequestWithUser extends Request {
  user?: CurrentUserData;
}

export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUserData | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (data) {
      return user?.[data];
    }

    return user;
  },
);
