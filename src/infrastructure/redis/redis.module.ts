import { Module, Global, Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: Redis;

  constructor(private configService: ConfigService) {
    const host = this.configService.get<string>('redis.host')!;
    const port = this.configService.get<number>('redis.port')!;
    const password = this.configService.get<string>('redis.password');

    const url = password ? `redis://:${password}@${host}:${port}` : `redis://${host}:${port}`;

    this.client = new Redis(url);
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
  providers: [RedisService, { provide: REDIS_CLIENT, useExisting: RedisService }],
  exports: [RedisService, REDIS_CLIENT],
})
export class RedisModule {}
