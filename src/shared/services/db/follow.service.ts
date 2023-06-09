import { IFollowData } from '@follow/interfaces/follow.interface';
import { IFollowDocument } from '@follow/interfaces/follow.interface';
import { FollowModel } from '@follow/models/follow.schema';
import { INotificationDocument, INotificationTemplate } from '@notification/interfaces/notification.interface';
import { NotificationModel } from '@notification/models/notification.schema';
import { IQueryComplete, IQueryDeleted } from '@post/interfaces/post.interface';
import { notificationTemplate } from '@service/emails/templates/notifications/notification-template';
import { emailQueue } from '@service/queues/email.queue';
import { UserCache } from '@service/redis/user.cache';
import { notificationSocketIOObject } from '@socket/notification.socket';
import { IUserDocument } from '@user/interfaces/user.interface';
import { UserModel } from '@user/models/user.schema';
import { map } from 'lodash';
import { ObjectId, BulkWriteResult } from 'mongodb';
import mongoose, { Query } from 'mongoose';

const userCache: UserCache = new UserCache();

class FollowService {
  public async addFollowToDB(userId: string, followeeId: string, username: string, followDocumentId: ObjectId): Promise<void> {
    const follow = await FollowModel.create({
      _id: followDocumentId,
      followeeId: new mongoose.Types.ObjectId(followeeId),
      followerId: new mongoose.Types.ObjectId(userId)
    });

    const users: Promise<BulkWriteResult> = UserModel.bulkWrite([
      {
        updateOne: {
          filter: { _id: userId },
          update: { $inc: { followingCount: 1 } }
        }
      },
      {
        updateOne: {
          filter: { _id: followeeId },
          update: { $inc: { followersCount: 1 } }
        }
      }
    ]);

    const result: [BulkWriteResult, IUserDocument | null] = await Promise.all([users, userCache.getUserFromCache(followeeId)]);

    if (result[1]?.notifications.follows && userId != followeeId) {
      const notificationModel: INotificationDocument = new NotificationModel();
      const notifications = await notificationModel.insertNotification({
        userFrom: userId,
        userTo: followeeId,
        message: `${username} is following you.`,
        notificationType: 'follows',
        entityId: new mongoose.Types.ObjectId(userId),
        createdItemId: new mongoose.Types.ObjectId(follow._id),
        createdAt: new Date(),
        comment: '',
        post: '',
        imgId: '',
        imgVersion: '',
        gifUrl: '',
        reaction: ''
      });
      notificationSocketIOObject.emit('insert notification', notifications, { followeeId });
      const templateParams: INotificationTemplate = {
        username: result[1].username!, //followee's username
        message: `${username} is following you.`,
        header: 'Follow Notification'
      };
      const template: string = notificationTemplate.notificationMessageTemplate(templateParams);
      emailQueue.addEmailJob('followEmail', { receiverEmail: result[1].email!, template, subject: 'Follow notification' });
    }
  }

  public async removeFollowerFromDB(followeeId: string, userId: string): Promise<void> {
    const unfollow: Query<IQueryComplete & IQueryDeleted, IFollowDocument> = FollowModel.deleteOne({
      followeeId: new mongoose.Types.ObjectId(followeeId),
      followerId: new mongoose.Types.ObjectId(userId)
    });

    const users: Promise<BulkWriteResult> = UserModel.bulkWrite([
      {
        updateOne: {
          filter: { _id: userId },
          update: { $inc: { followingCount: -1 } }
        }
      },
      {
        updateOne: {
          filter: { _id: followeeId },
          update: { $inc: { followersCount: -1 } }
        }
      }
    ]);

    await Promise.all([unfollow, users]);
  }

  public async getFolloweeFromDB(id: ObjectId): Promise<IFollowData[]> {
    const followee: IFollowData[] = await FollowModel.aggregate([
      { $match: { followerId: id } },
      { $lookup: { from: 'User', localField: 'followeeId', foreignField: '_id', as: 'followee' } },
      { $unwind: '$followee' },
      { $lookup: { from: 'Auth', localField: 'followee.authId', foreignField: '_id', as: 'auth' } },
      { $unwind: '$auth' },
      {
        $addFields: {
          _id: '$followee._id',
          username: '$auth.username',
          avatarColor: '$auth.avatarColor',
          uId: '$auth.uId',
          postCount: '$followee.postsCount',
          followersCount: '$followee.followersCount',
          followingCount: '$followee.followingCount',
          profilePicture: '$followee.profilePicture',
          userProfile: '$followee'
        }
      },
      {
        $project: {
          auth: 0,
          followerId: 0,
          followeeId: 0,
          createdAt: 0,
          __v: 0
        }
      }
    ]);
    return followee;
  }

  public async getFollowerFromDB(id: ObjectId): Promise<IFollowData[]> {
    const follower: IFollowData[] = await FollowModel.aggregate([
      { $match: { followeeId: id } },
      { $lookup: { from: 'User', localField: 'followerId', foreignField: '_id', as: 'follower' } },
      { $unwind: '$follower' },
      { $lookup: { from: 'Auth', localField: 'follower.authId', foreignField: '_id', as: 'auth' } },
      { $unwind: '$auth' },
      {
        $addFields: {
          _id: '$follower._id',
          username: '$auth.username',
          avatarColor: '$auth.avatarColor',
          uId: '$auth.uId',
          postCount: '$follower.postsCount',
          followersCount: '$follower.followersCount',
          followingCount: '$follower.followingCount',
          profilePicture: '$follower.profilePicture',
          userProfile: '$follower'
        }
      },
      {
        $project: {
          auth: 0,
          followerId: 0,
          followeeId: 0,
          createdAt: 0,
          __v: 0
        }
      }
    ]);
    return follower;
  }

  public async getFollowersId(userId: string): Promise<string[]> {
    const followee = await FollowModel.aggregate([
      { $match: { followeeId: new mongoose.Types.ObjectId(userId) } },
      {
        $project: {
          followerId: 1,
          _id: 0
        }
      }
    ]);
    return map(followee, (result) => result.followerId.toString());
  }
}

export const followService: FollowService = new FollowService();
