import { Module, Global, Injectable, OnModuleDestroy } from "@nestjs/common";
import Redis from "ioredis";

export const REDIS_CLIENT = "REDIS_CLIENT";

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: Redis;

  constructor() {
    this.client = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
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
