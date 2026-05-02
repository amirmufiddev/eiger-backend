import { Auth, LogLevel } from 'better-auth';
import { Logger } from '@nestjs/common';

import { createAuth, authOptions } from 'src/auth';

export interface AuthFactoryDeps {
  logger: Logger;
}

export function createAuthFactory(deps: AuthFactoryDeps): Auth<any> {
  const { logger } = deps;
  logger.log('Creating auth instance', 'BetterAuth');
  return createAuth({
    ...authOptions,
    logger: {
      disabled: false,
      log: (level: LogLevel, message: string) =>
        logger.log(message, 'BetterAuth'),
    },
  });
}
