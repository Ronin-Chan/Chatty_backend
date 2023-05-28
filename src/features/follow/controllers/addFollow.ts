import HTTP_STATUS from 'http-status-codes';
import { Request, Response } from 'express';
import { FollowCache } from '@service/redis/follow.cache';
import { UserCache } from '@service/redis/user.cache';
import { IUserDocument } from '@user/interfaces/user.interface';
import { IFollowData } from '@follow/interfaces/follow.interface';
import mongoose from 'mongoose';
import { followSocketIOObject } from '@socket/follow.socket';
import { ObjectId } from 'mongodb';
import { followQueue } from '@service/queues/follow.queue';

const followCache: FollowCache = new FollowCache();
const userCache: UserCache = new UserCache();

export class AddFollow{
  //current user as follower
  //follower is someone follow others
  public async addFollow(req: Request, res: Response): Promise<void>{
    const { followeeId } = req.params;

    //update count
    await followCache.updateFollowersOrFollowingCountInCache(followeeId, 'followersCount', 1);
    await followCache.updateFollowersOrFollowingCountInCache(`${req.currentUser?.userId}`, 'followingCount', 1);

    //get user
    const cachedFollowee: Promise<IUserDocument> = userCache.getUserFromCache(followeeId) as Promise<IUserDocument>;
    const cachedFollower: Promise<IUserDocument> = userCache.getUserFromCache(`${req.currentUser?.userId}`) as Promise<IUserDocument>;
    const result: [IUserDocument, IUserDocument] = await Promise.all([cachedFollowee, cachedFollower]);

    const followObjectId: ObjectId = new ObjectId();
    const addFolloweeData: IFollowData = AddFollow.prototype.userData(result[0]);
    followSocketIOObject.emit('add follower', addFolloweeData);

    //add follower or followee
    await followCache.saveFollowerOrFolloweeToCache(`followersOf:${followeeId}`, `${req.currentUser?.userId}`);
    await followCache.saveFollowerOrFolloweeToCache(`followingsOf:${req.currentUser?.userId}`, followeeId);

    followQueue.addFollowJob('addFollowToDB', {
      userId: `${req.currentUser!.userId}`,
      followeeId: `${followeeId}`,
      username: req.currentUser!.username,
      followDocumentId: followObjectId
    });

    res.status(HTTP_STATUS.OK).json({ message: 'Following user now' });
  }

  private userData(user: IUserDocument): IFollowData {
    return {
      _id: new mongoose.Types.ObjectId(user._id),
      username: user.username!,
      avatarColor: user.avatarColor!,
      postCount: user.postsCount,
      followersCount: user.followersCount,
      followingCount: user.followingCount,
      profilePicture: user.profilePicture,
      uId: user.uId!,
      userProfile: user
    };
  }

}
