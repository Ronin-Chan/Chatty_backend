import { config } from '@root/config';
import { authService } from '@service/db/auth.service';
import { DoneCallback, Job } from 'bull';
import Logger from 'bunyan';

const log: Logger = config.createLogger('authWorker');

class AuthWorker {
  async addAuthUserToDB(job: Job, done: DoneCallback): Promise<void> {
    try {
      //this value is used in signup.ts
      // - authQueue.addAuthUserJob('addAuthUserToDb', { value: userDataForCache });
      const { value } = job.data;
      await authService.createAuthUser(value);
      job.progress(100);
      done(null, job.data); //first param is error, successful so we pass in null
    } catch (error) {
      log.error(error);
      done(error as Error);
    }
  }
}

export const authWorker: AuthWorker = new AuthWorker();
