import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import databaseConfig from './config/database.config';
import redisConfig from './config/redis.config';
import { validateEnv } from './config/env.validation';
import { RedisModule } from './infrastructure/redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      load: [databaseConfig, redisConfig],
      expandVariables: true,
    }),
    RedisModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
