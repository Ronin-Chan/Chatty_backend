import HTTP_STATUS from 'http-status-codes';
import { Request, Response } from 'express';
import { FollowCache } from '@service/redis/follow.cache';
import { followQueue } from '@service/queues/follow.queue';

const followCache: FollowCache = new FollowCache();

export class RemoveFollow {
  //current user as follower
  //follower is someone follow others
  public async removeFollow(req: Request, res: Response): Promise<void> {
    const { followeeId } = req.params;

    //remove follower or followee from redis
    await followCache.removeFollowerOrFolloweeFromCache(`followers:${followeeId}`, `${req.currentUser?.userId}`);
    await followCache.removeFollowerOrFolloweeFromCache(`following:${req.currentUser?.userId}`, followeeId);

    //update count
    await followCache.updateFollowersOrFollowingCountInCache(followeeId, 'followersCount', -1);
    await followCache.updateFollowersOrFollowingCountInCache(`${req.currentUser?.userId}`, 'followingCount', -1);

    followQueue.addFollowJob('removeFollowFromDB', {
      userId: `${req.currentUser!.userId}`,
      followeeId: `${followeeId}`
    });

    res.status(HTTP_STATUS.OK).json({ message: 'Unfollow user successfully' });
  }
}
