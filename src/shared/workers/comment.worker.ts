import { config } from '@root/config';
import { commentService } from '@service/db/comment.service';
import { DoneCallback, Job } from 'bull';
import Logger from 'bunyan';

const log: Logger = config.createLogger('commentWorker');

class CommentWorker {
  async addCommentToDB(job: Job, done: DoneCallback): Promise<void> {
    try {
      const { data } = job;
      await commentService.addCommentToDB(data);
      done(null, job.data); //first param is error, successful so we pass in null
    } catch (error) {
      log.error(error);
      done(error as Error);
    }
  }
}

export const commentWorker: CommentWorker = new CommentWorker();
