import { Module } from '@nestjs/common';
import { AuthModule as BetterAuthModule } from '@thallesp/nestjs-better-auth';
import { AuthHooks } from './auth.hook';
import { ConfigService } from '@nestjs/config';
import { createAuth } from './auth.factory';

@Module({
  imports: [
    BetterAuthModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        auth: createAuth({ configService }),
        bodyParser: {
          json: { limit: '2mb' },
          urlencoded: { limit: '2mb', extended: true },
          rawBody: true,
        },
      }),
    }),
  ],
  providers: [AuthHooks],
})
export class AuthModule {}
