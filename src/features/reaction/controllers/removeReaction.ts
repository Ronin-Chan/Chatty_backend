import { IReactionJob } from '@reaction/interfaces/reaction.interface';
import { Request, Response } from 'express';
import { ReactionCache } from '@service/redis/reaction.cache';
import HTTP_STATUS from 'http-status-codes';
import { reactionQueue } from '@service/queues/reaction.queue';

const reactionCache: ReactionCache = new ReactionCache();

export class RemoveReaction {
  public async removeReaction(req: Request, res: Response): Promise<void> {
    const { postId, previousReaction, postReactions } = req.params; //data in params would be string
    await reactionCache.removePostReactionFromCache(postId, `${req.currentUser!.username}`, JSON.parse(postReactions));
    const reactionJob: IReactionJob = {
      postId,
      username: req.currentUser!.username,
      previousReaction
    };
    reactionQueue.addReactionJob('removeReactionFromDB', reactionJob);
    res.status(HTTP_STATUS.OK).json({ message: 'Reaction removed from post' });
  }
}
