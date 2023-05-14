import { postQueue } from '@service/queues/post.queue';
import { PostCache } from '@service/redis/post.cache';
import { postSocketIOObject } from '@socket/post.socket';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

const postCache: PostCache = new PostCache();

export class DeletePost{
  public async deletePost(req: Request, res: Response): Promise<void> {
    postSocketIOObject.emit('delete post', req.params.postId);
    await postCache.deletePostFromCache(req.params.postId, `${req.currentUser!.userId}`);
    postQueue.addPostJob('deletePostFromDB', { keyOne: req.params.postId, keyTwo: req.currentUser!.userId });
    res.status(HTTP_STATUS.OK).json({ message: 'Post deleted successfully' });
  }
}
