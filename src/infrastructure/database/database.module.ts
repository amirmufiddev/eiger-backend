import { Module, Global } from '@nestjs/common';
import { getDbConnection } from '.';
import { ConfigService } from '@nestjs/config';

export const DATABASE_CONNECTION = 'DATABASE_CONNECTION';

@Global()
@Module({
  providers: [
    {
      provide: DATABASE_CONNECTION,
      useFactory: (configService: ConfigService) => {
        console.log('DATABASE_URL', configService.get<string>('DATABASE_URL'));
        return getDbConnection(configService.get<string>('DATABASE_URL'));
      },
      inject: [ConfigService],
    },
  ],
  exports: [DATABASE_CONNECTION],
})
export class DatabaseModule {}
