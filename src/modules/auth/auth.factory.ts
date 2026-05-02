import { Auth, LogLevel } from 'better-auth';
import { Logger } from '@nestjs/common';

import { createAuth, createAuthOptions } from '../../auth';

export interface AuthFactoryDeps {
  logger: Logger;
  databaseUrl: string;
  baseURL: string;
  secret: string;
}

export function createAuthFactory(deps: AuthFactoryDeps): Auth<any> {
  const { logger, databaseUrl, baseURL, secret } = deps;
  logger.log('Creating auth instance', 'BetterAuth');
  return createAuth({
    ...createAuthOptions({ databaseUrl, baseURL, secret }),
    logger: {
      disabled: false,
      log: (level: LogLevel, message: string) =>
        logger.log(message, 'BetterAuth'),
    },
  });
}
