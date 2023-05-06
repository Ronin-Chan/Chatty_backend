import { config } from '@root/config';
import { userService } from '@service/db/user.service';
import { DoneCallback, Job } from 'bull';
import Logger from 'bunyan';

const log: Logger = config.createLogger('userWorker');

class UserWorker {
  async addUserToDB(job: Job, done: DoneCallback): Promise<void> {
    try {
      //this value is used in signup.ts
      // - authQueue.addAuthUserJob('addUserToDb', { value: userDataForCache });
      const { value } = job.data;
      await userService.createUser(value);
      job.progress(100);
      done(null, job.data); //first param is error, successful so we pass in null
    } catch (error) {
      log.error(error);
      done(error as Error);
    }
  }
}

export const userWorker: UserWorker = new UserWorker();
