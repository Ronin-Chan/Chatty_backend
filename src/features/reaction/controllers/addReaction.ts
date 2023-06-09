import { ObjectId } from 'mongodb';
import { IReactionDocument, IReactionJob } from '@reaction/interfaces/reaction.interface';
import { Request, Response } from 'express';
import { ReactionCache } from '@service/redis/reaction.cache';
import HTTP_STATUS from 'http-status-codes';
import { reactionQueue } from '@service/queues/reaction.queue';
import { addReactionSchema } from '@reaction/schemes/reactions.scheme';
import { joiValidation } from '@global/decorators/joiValidation.decorators';

const reactionCache: ReactionCache = new ReactionCache();

export class AddReaction {
  @joiValidation(addReactionSchema)
  public async addReaction(req: Request, res: Response): Promise<void> {
    const { postId, type, userTo, previousReaction, postReactions, profilePicture } = req.body;
    const reactionObject: IReactionDocument = {
      _id: new ObjectId(),
      username: req.currentUser?.username,
      avataColor: req.currentUser?.avatarColor,
      type,
      postId,
      profilePicture
    } as IReactionDocument;

    await reactionCache.savePostReactionToCache(postId, reactionObject, postReactions, type, previousReaction);

    const reactionJob: IReactionJob = {
      postId,
      username: req.currentUser?.username,
      previousReaction,
      userTo,
      userFrom: req.currentUser?.userId,
      type,
      reactionObject
    } as IReactionJob;
    reactionQueue.addReactionJob('addReactionToDB', reactionJob);

    res.status(HTTP_STATUS.OK).json({ message: 'Reaction added successfully' });
  }
}
