import { Logger, Module } from '@nestjs/common';
import { AuthModule as BetterAuthModule } from '@thallesp/nestjs-better-auth';
import { AuthHooks } from './auth.hook';
import { createAuthFactory } from './auth.factory';

@Module({
  imports: [
    BetterAuthModule.forRootAsync({
      inject: [Logger],
      useFactory: (logger: Logger) => ({
        auth: createAuthFactory({ logger }),
        bodyParser: {
          json: { limit: '2mb' },
          urlencoded: { limit: '2mb', extended: true },
          rawBody: true,
        },
        disableTrustedOriginsCors: true,
      }),
    }),
  ],
  providers: [AuthHooks],
})
export class AuthModule {}
