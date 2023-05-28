import { Helpers } from '@global/helpers/helpers';
import { BaseCache } from '@service/redis/base.cache';
import { remove } from 'lodash';
import { ServerError } from '@global/helpers/errorHandler';
import { config } from '@root/config';
import Logger from 'bunyan';

const log: Logger = config.createLogger('blockCache');

export class BlockCache extends BaseCache{
  constructor() {
    super('blockCache');
  }
  //key - userId / blockedUserId
  //prop - blocked / blockedBy
  //value - userId / blockedUserId
  public async updateBlockInCache(key: string, prop: string, value: string, type: 'block' | 'unblock'): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      //get - update - set back
      const result: string = (await this.client.HGET(`users:${key}`, prop)) as string;
      const multi: ReturnType<typeof this.client.multi> = this.client.multi();
      let blocked: string[] = Helpers.customJsonParse(result) as string[];
      if (type === 'block') {
        blocked = [...blocked, value];
      } else {
        remove(blocked, (id: string) => id === value);
        blocked = [...blocked];
      }
      multi.HSET(`users:${key}`, `${prop}`, JSON.stringify(blocked));
      await multi.exec();

    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }
}
