import { Module, Global, Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: Redis;

  constructor(private configService: ConfigService) {
    const redisUrl = this.configService.get<string>('redis.url')!;
    this.client = new Redis(redisUrl);
  }

  getClient(): Redis {
    return this.client;
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}

@Global()
@Module({
  providers: [
    RedisService,
    { provide: REDIS_CLIENT, useExisting: RedisService },
  ],
  exports: [RedisService, REDIS_CLIENT],
})
export class RedisModule {}
