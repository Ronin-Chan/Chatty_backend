import { config } from '@root/config';
import { followService } from '@service/db/follow.service';
import { DoneCallback, Job } from 'bull';
import Logger from 'bunyan';

const log: Logger = config.createLogger('followWorker');

class FollowWorker {
  async addFollowToDB(job: Job, done: DoneCallback): Promise<void> {
    try {
      const { userId, followeeId, username, followDocumentId } = job.data;
      await followService.addFollowToDB(userId, followeeId, username, followDocumentId);
      done(null, job.data); //first param is error, successful so we pass in null
    } catch (error) {
      log.error(error);
      done(error as Error);
    }
  }

  async removeFollowFromDB(job: Job, done: DoneCallback): Promise<void> {
    try {
      const { userId, followeeId } = job.data;
      await followService.removeFollowerFromDB(followeeId, userId);
      done(null, job.data); //first param is error, successful so we pass in null
    } catch (error) {
      log.error(error);
      done(error as Error);
    }
  }
}

export const followWorker: FollowWorker = new FollowWorker();
