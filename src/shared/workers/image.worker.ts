import { DoneCallback, Job } from 'bull';
import Logger from 'bunyan';
import { config } from '@root/config';
import { imageService } from '@service/db/image.service';

const log: Logger = config.createLogger('emailWorker');

class ImageWorker {
  async addImageToDB(job: Job, done: DoneCallback): Promise<void> {
    try {
      const { userId, imgId, imgVersion, type } = job.data;
      await imageService.addImageToDB(userId, imgId, imgVersion, type);
      job.progress(100);
      done(null, job.data);
    } catch (error) {
      log.error(error);
      done(error as Error);
    }
  }

  async addProfileImageToDB(job: Job, done: DoneCallback): Promise<void> {
    try {
      const { userId, imgId, imgVersion, url } = job.data;
      await imageService.addProfileImageToDB(userId, imgId, imgVersion, url);
      job.progress(100);
      done(null, job.data);
    } catch (error) {
      log.error(error);
      done(error as Error);
    }
  }

  async addBgImageToDB(job: Job, done: DoneCallback): Promise<void> {
    try {
      const { userId, imgId, imgVersion } = job.data;
      await imageService.addBgImageToDB(userId, imgId, imgVersion);
      job.progress(100);
      done(null, job.data);
    } catch (error) {
      log.error(error);
      done(error as Error);
    }
  }

  async removeImageFromDB(job: Job, done: DoneCallback): Promise<void> {
    try {
      const { imageId } = job.data;
      await imageService.removeImageFromDB(imageId);
      job.progress(100);
      done(null, job.data);
    } catch (error) {
      log.error(error);
      done(error as Error);
    }
  }
}

export const imageWorker: ImageWorker = new ImageWorker();
