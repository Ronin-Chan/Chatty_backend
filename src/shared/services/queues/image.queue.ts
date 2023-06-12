import { IFileImageJobData } from '@image/interfaces/image.interface';
import { BaseQueue } from '@service/queues/base.queue';
import { imageWorker } from '@worker/image.worker';

class ImageQueue extends BaseQueue {
  constructor() {
    super('image');
    this.processJob('addImageToDB', 5, imageWorker.addImageToDB);
    this.processJob('addProfileImageToDB', 5, imageWorker.addProfileImageToDB);
    this.processJob('addBgImageToDB', 5, imageWorker.addBgImageToDB);
    this.processJob('removeImageFromDB', 5, imageWorker.removeImageFromDB);
  }

  public addImageJob(name: string, data: IFileImageJobData): void {
    this.addJob(name, data);
  }
}

export const imageQueue: ImageQueue = new ImageQueue();
