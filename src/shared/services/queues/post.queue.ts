import { IPostJobData } from '@post/interfaces/post.interface';
import { BaseQueue } from '@service/queues/base.queue';
import { postWorker } from '@worker/post.worker';


class PostQueue extends BaseQueue{
  constructor() {
    super('post');
    this.processJob('addPostToDB', 5, postWorker.addPostToDB);
    this.processJob('deletePostFromDB', 5, postWorker.deletePostFromDB);
    this.processJob('updatePostInDB', 5, postWorker.updatePostInDB);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public addPostJob(name: string, data: IPostJobData): void {
    this.addJob(name, data);
  }
}

export const postQueue: PostQueue = new PostQueue();