import { config } from '@root/config';
import { blockService } from '@service/db/block.service';
import { DoneCallback, Job } from 'bull';
import Logger from 'bunyan';

const log: Logger = config.createLogger('blockWorker');

class BlockWorker {
  async updateBlockOrUnblockInDB(job: Job, done: DoneCallback): Promise<void> {
    try {
      const { userId, blockedUserId, type } = job.data;
      if (type === 'block') {
        await blockService.updateBlockInDB(userId, blockedUserId);
      } else {
        await blockService.updateUnBlockInDB(userId, blockedUserId);
      }
      done(null, job.data); //first param is error, successful so we pass in null
    } catch (error) {
      log.error(error);
      done(error as Error);
    }
  }
}

export const blockWorker: BlockWorker = new BlockWorker();
