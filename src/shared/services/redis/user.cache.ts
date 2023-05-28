import { BaseCache } from '@service/redis/base.cache';
import { IUserDocument } from '@user/interfaces/user.interface';
import { config } from '@root/config';
import Logger from 'bunyan';
import { ServerError } from '@global/helpers/errorHandler';
import { Helpers } from '@global/helpers/helpers';

const log: Logger = config.createLogger('userCache');

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
}
