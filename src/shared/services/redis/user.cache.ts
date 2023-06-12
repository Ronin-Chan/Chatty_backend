import { BaseCache } from '@service/redis/base.cache';
import { INotificationSettings, ISocialLinks, IUserDocument } from '@user/interfaces/user.interface';
import { config } from '@root/config';
import Logger from 'bunyan';
import { ServerError } from '@global/helpers/errorHandler';
import { Helpers } from '@global/helpers/helpers';
import { RedisCommandRawReply } from '@redis/client/dist/lib/commands';
import { findIndex, indexOf } from 'lodash';

const log: Logger = config.createLogger('userCache');
type UserItem = string | ISocialLinks | INotificationSettings;
type UserCacheMultiType = string | number | Buffer | RedisCommandRawReply[] | IUserDocument | IUserDocument[];

export class UserCache extends BaseCache {
  constructor() {
    super('userCache');
  }

  public async saveUserToCache(key: string, userUId: string, createdUser: IUserDocument): Promise<void> {
    const createdAt = new Date();
    const {
      _id,
      uId,
      username,
      email,
      avatarColor,
      blocked,
      blockedBy,
      postsCount,
      profilePicture,
      followersCount,
      followingCount,
      notifications,
      work,
      location,
      school,
      quote,
      bgImageId,
      bgImageVersion,
      social
    } = createdUser;
    const firstList: string[] = [
      '_id',
      `${_id}`,
      'uId',
      `${uId}`,
      'username',
      `${username}`,
      'email',
      `${email}`,
      'avatarColor',
      `${avatarColor}`,
      'createdAt',
      `${createdAt}`,
      'postsCount',
      `${postsCount}`
    ];
    const secondList: string[] = [
      'blocked',
      JSON.stringify(blocked),
      'blockedBy',
      JSON.stringify(blockedBy),
      'profilePicture',
      `${profilePicture}`,
      'followersCount',
      `${followersCount}`,
      'followingCount',
      `${followingCount}`,
      'notifications',
      JSON.stringify(notifications),
      'social',
      JSON.stringify(social)
    ];
    const thirdList: string[] = [
      'work',
      `${work}`,
      'location',
      `${location}`,
      'school',
      `${school}`,
      'quote',
      `${quote}`,
      'bgImageVersion',
      `${bgImageVersion}`,
      'bgImageId',
      `${bgImageId}`
    ];
    const dataToSave: string[] = [...firstList, ...secondList, ...thirdList];

    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      //score as key, value as value
      await this.client.ZADD('user', { score: parseInt(userUId, 10), value: `${key}` });
      // await this.client.HSET(`users:${key}`, dataToSave);
      for (let i = 0; i < dataToSave.length; i += 2) {
        await this.client.HSET(`users:${key}`, dataToSave[i], dataToSave[i + 1]);
      }
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async getUserFromCache(userId: string): Promise<IUserDocument | null> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      const res: IUserDocument = (await this.client.HGETALL(`users:${userId}`)) as unknown as IUserDocument;
      res.createdAt = new Date(Helpers.customJsonParse(`${res.createdAt}`));
      res.postsCount = Helpers.customJsonParse(`${res.postsCount}`);
      res.blocked = Helpers.customJsonParse(`${res.blocked}`);
      res.blockedBy = Helpers.customJsonParse(`${res.blockedBy}`);
      res.notifications = Helpers.customJsonParse(`${res.notifications}`);
      res.social = Helpers.customJsonParse(`${res.social}`);
      res.followersCount = Helpers.customJsonParse(`${res.followersCount}`);
      res.followingCount = Helpers.customJsonParse(`${res.followingCount}`);
      res.bgImageId = Helpers.customJsonParse(`${res.bgImageId}`);
      res.bgImageVersion = Helpers.customJsonParse(`${res.bgImageVersion}`);
      res.profilePicture = Helpers.customJsonParse(`${res.profilePicture}`);
      res.work = Helpers.customJsonParse(`${res.work}`);
      res.school = Helpers.customJsonParse(`${res.school}`);
      res.location = Helpers.customJsonParse(`${res.location}`);
      res.quote = Helpers.customJsonParse(`${res.quote}`);

      return res;
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async getUsersFromCache(start: number, end: number, excludedId: string): Promise<IUserDocument[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      const userIdList: string[] = await this.client.ZRANGE('user', start, end);
      const reversedUserIdList = userIdList.reverse();
      const multi = this.client.multi();
      for (const userId of reversedUserIdList) {
        if (userId !== excludedId) {
          multi.HGETALL(`users:${userId}`);
        }
      }
      const userList: UserCacheMultiType = (await multi.exec()) as UserCacheMultiType;
      const parsedUserList: IUserDocument[] = [];
      for (const user of userList as IUserDocument[]) {
        user.createdAt = new Date(Helpers.customJsonParse(`${user.createdAt}`));
        user.postsCount = Helpers.customJsonParse(`${user.postsCount}`);
        user.blocked = Helpers.customJsonParse(`${user.blocked}`);
        user.blockedBy = Helpers.customJsonParse(`${user.blockedBy}`);
        user.notifications = Helpers.customJsonParse(`${user.notifications}`);
        user.social = Helpers.customJsonParse(`${user.social}`);
        user.followersCount = Helpers.customJsonParse(`${user.followersCount}`);
        user.followingCount = Helpers.customJsonParse(`${user.followingCount}`);
        user.bgImageId = Helpers.customJsonParse(`${user.bgImageId}`);
        user.bgImageVersion = Helpers.customJsonParse(`${user.bgImageVersion}`);
        user.profilePicture = Helpers.customJsonParse(`${user.profilePicture}`);
        user.work = Helpers.customJsonParse(`${user.work}`);
        user.school = Helpers.customJsonParse(`${user.school}`);
        user.location = Helpers.customJsonParse(`${user.location}`);
        user.quote = Helpers.customJsonParse(`${user.quote}`);
        parsedUserList.push(user);
      }
      return parsedUserList;
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async getTotalUsersInCache(): Promise<number> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const count: number = await this.client.ZCARD('user');
      return count;
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async getRandomUsers(userId: string, excludedUsername: string): Promise<IUserDocument[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const userIdList: string[] = await this.client.ZRANGE('user', 0, -1);
      const randomUserIdList: string[] = Helpers.shuffle(userIdList).slice(0, 10);
      const followerList: string[] = await this.client.LRANGE(`followersOf:${userId}`, 0, -1);
      const excludeFollowerUserIdList: IUserDocument[] = [];
      for (const item of randomUserIdList) {
        const index: number = indexOf(followerList, item);
        if (index < 0) {
          const user: IUserDocument = (await this.client.HGETALL(`users:${item}`)) as unknown as IUserDocument;
          excludeFollowerUserIdList.push(user);
        }
      }
      const excludedUsernameIndex: number = findIndex(excludeFollowerUserIdList, ['username', excludedUsername]);
      excludeFollowerUserIdList.splice(excludedUsernameIndex, 1);
      for (const item of excludeFollowerUserIdList) {
        item.createdAt = new Date(Helpers.customJsonParse(`${item.createdAt}`));
        item.postsCount = Helpers.customJsonParse(`${item.postsCount}`);
        item.blocked = Helpers.customJsonParse(`${item.blocked}`);
        item.blockedBy = Helpers.customJsonParse(`${item.blockedBy}`);
        item.notifications = Helpers.customJsonParse(`${item.notifications}`);
        item.social = Helpers.customJsonParse(`${item.social}`);
        item.followersCount = Helpers.customJsonParse(`${item.followersCount}`);
        item.followingCount = Helpers.customJsonParse(`${item.followingCount}`);
        item.bgImageId = Helpers.customJsonParse(`${item.bgImageId}`);
        item.bgImageVersion = Helpers.customJsonParse(`${item.bgImageVersion}`);
        item.profilePicture = Helpers.customJsonParse(`${item.profilePicture}`);
        item.work = Helpers.customJsonParse(`${item.work}`);
        item.school = Helpers.customJsonParse(`${item.school}`);
        item.location = Helpers.customJsonParse(`${item.location}`);
        item.quote = Helpers.customJsonParse(`${item.quote}`);
      }
      return excludeFollowerUserIdList;
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async updateSingleUserItemInCache(userId: string, prop: string, value: UserItem): Promise<IUserDocument | null> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      await this.client.HSET(`users:${userId}`, `${prop}`, JSON.stringify(value));
      const result: IUserDocument = (await this.getUserFromCache(userId)) as IUserDocument;
      return result;
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }
}
