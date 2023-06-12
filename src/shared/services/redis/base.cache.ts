import { config } from '@root/config';
import Logger from 'bunyan';
import { createClient } from 'redis';

export type RedisClient = ReturnType<typeof createClient>; //because redis doesn't provide type
export abstract class BaseCache {
  //we can create one by ourselves
  client: RedisClient;
  log: Logger;

  constructor(cacheName: string) {
    this.client = createClient({ url: config.REDIS_HOST });
    this.log = config.createLogger(cacheName);
    this.cacheError();
  }

  private cacheError(): void {
    this.client.on('error', (error: unknown) => {
      //unknown, because redis doesn't provide type
      this.log.error(error);
    });
  }
}
