import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import { IReactionDocument } from '@reaction/interfaces/reaction.interface';
import { ReactionCache } from '@service/redis/reaction.cache';
import { reactionService } from '@service/db/reaction.service';
import mongoose from 'mongoose';

const reactionCache: ReactionCache = new ReactionCache();

export class GetReaction {
  public async getReactions(req: Request, res: Response): Promise<void> {
    const { postId } = req.params;
    const cachedReactions: [IReactionDocument[], number] = await reactionCache.getPostReactionsFromCache(postId);
    const reactions: [IReactionDocument[], number] = cachedReactions[0].length
      ? cachedReactions
      : await reactionService.getPostReactions({ postId: new mongoose.Types.ObjectId(postId) }, { createdAt: -1 });
    res.status(HTTP_STATUS.OK).json({ message: 'Post reactions', reactions: reactions[0], count: reactions[1] });
  }

  public async getSingleReactionByUsername(req: Request, res: Response): Promise<void> {
    const { postId, username } = req.params;
    const cachedReaction: [IReactionDocument, number] | [] = await reactionCache.getSinglePostReactionByUsernameFromCache(postId, username);
    const reaction: [IReactionDocument, number] | [] = cachedReaction.length
      ? cachedReaction
      : await reactionService.getSinglePostReactionByUsername(postId, username);
    res.status(HTTP_STATUS.OK).json({
      message: 'Single post reaction by username',
      reactions: reaction.length ? reaction[0] : {},
      count: reaction.length ? reaction[1] : 0
    });
  }

  public async getReactionsByUsername(req: Request, res: Response): Promise<void> {
    const { username } = req.params;
    const reactions: IReactionDocument[] = await reactionService.getReactionsByUsername(username);
    res.status(HTTP_STATUS.OK).json({ message: 'All user reactions by username', reactions });
  }
}
