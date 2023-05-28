import { IFollowJobData } from '@follow/interfaces/follow.interface';
import { BaseQueue } from '@service/queues/base.queue';
import { followWorker } from '@worker/follow.worker';

class FollowQueue extends BaseQueue {
  constructor() {
    super('follow');
    this.processJob('addFollowToDB', 5, followWorker.addFollowToDB);
    this.processJob('removeFollowFromDB', 5, followWorker.removeFollowFromDB);
  }

  public addFollowJob(name: string, data: IFollowJobData): void {
    this.addJob(name, data);
  }
}

export const followQueue: FollowQueue = new FollowQueue();
