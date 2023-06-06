import HTTP_STATUS from 'http-status-codes';
import { Request, Response } from 'express';
import { FollowCache } from '@service/redis/follow.cache';
import { IFollowData } from '@follow/interfaces/follow.interface';
import { followService } from '@service/db/follow.service';
import mongoose from 'mongoose';

const followCache: FollowCache = new FollowCache();

export class GetFollow {
  public async getFollower(req: Request, res: Response): Promise<void> {
    const cachedFollower: IFollowData[] = await followCache.getFollowerOrFolloweeFromCache(`followerOf:${req.currentUser?.userId}`);
    const follower: IFollowData[] =
      cachedFollower.length > 0
        ? cachedFollower
        : await followService.getFollowerFromDB(new mongoose.Types.ObjectId(req.currentUser?.userId));
    res.status(HTTP_STATUS.OK).json({ message: 'User followers', follower });
  }

  public async getFollowee(req: Request, res: Response): Promise<void> {
    const cachedFollowee: IFollowData[] = await followCache.getFollowerOrFolloweeFromCache(`followingsOf:${req.currentUser?.userId}`);
    const followee: IFollowData[] =
      cachedFollowee.length > 0
        ? cachedFollowee
        : await followService.getFolloweeFromDB(new mongoose.Types.ObjectId(req.currentUser?.userId));
    res.status(HTTP_STATUS.OK).json({ message: 'User followings', followee });
  }
}
