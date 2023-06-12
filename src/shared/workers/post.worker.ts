import { config } from '@root/config';
import { postService } from '@service/db/post.service';
import { DoneCallback, Job } from 'bull';
import Logger from 'bunyan';

const log: Logger = config.createLogger('postWorker');

class PostWorker {
  async addPostToDB(job: Job, done: DoneCallback): Promise<void> {
    try {
      const { key, value } = job.data;
      await postService.createPost(key, value);
      job.progress(100);
      done(null, job.data); //first param is error, successful so we pass in null
    } catch (error) {
      log.error(error);
      done(error as Error);
    }
  }

  async deletePostFromDB(job: Job, done: DoneCallback): Promise<void> {
    try {
      const { keyOne, keyTwo } = job.data;
      await postService.deletePost(keyOne, keyTwo); //keyOne: req.params.postId, keyTwo: req.currentUser!.userId
      job.progress(100);
      done(null, job.data);
    } catch (error) {
      log.error(error);
      done(error as Error);
    }
  }

  async updatePostInDB(job: Job, done: DoneCallback): Promise<void> {
    try {
      const { key, value } = job.data;
      await postService.updatePost(key, value); //key: postId, value: updatedPost
      job.progress(100);
      done(null, job.data);
    } catch (error) {
      log.error(error);
      done(error as Error);
    }
  }
}

export const postWorker: PostWorker = new PostWorker();
