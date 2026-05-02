import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { Request } from 'express';
import { DATABASE_CONNECTION } from '../../infrastructure/database/database.module';
import { sessions, users } from '../../infrastructure/database/schema/index';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as schema from '../../infrastructure/database/schema/index';

interface RequestWithUser extends Request {
  user?: {
    id: string;
    email: string;
    name: string | null;
    role: 'admin' | 'member';
  };
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private db: PostgresJsDatabase<typeof schema>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      const cookieToken = (request.cookies as Record<string, string>)?.[
        'better-auth.session_token'
      ];
      if (cookieToken) {
        return this.validateToken(cookieToken, request);
      }
      throw new UnauthorizedException('No authorization token provided');
    }

    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid authorization header');
    }

    return this.validateToken(token, request);
  }

  private async validateToken(
    token: string,
    request: RequestWithUser,
  ): Promise<boolean> {
    const sessionResult = await this.db
      .select({
        session: sessions,
        user: users,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(eq(sessions.token, token))
      .limit(1);

    if (sessionResult.length === 0) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    const { session, user } = sessionResult[0];

    if (new Date() > session.expiresAt) {
      throw new UnauthorizedException('Session expired');
    }

    request.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    return true;
  }
}
