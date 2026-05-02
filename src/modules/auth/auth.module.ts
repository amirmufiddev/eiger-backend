import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthModule as BetterAuthModule } from '@thallesp/nestjs-better-auth';
import { AuthHooks } from './auth.hook';
import { createAuthFactory } from './auth.factory';

@Module({
  imports: [
    BetterAuthModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        auth: createAuthFactory({
          logger: new Logger('BetterAuth'),
          databaseUrl: configService.get<string>('DATABASE_URL')!,
          baseURL: configService.get<string>('BETTER_AUTH_URL')!,
          secret: configService.get<string>('BETTER_AUTH_SECRET')!,
        }),
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
