import { IBasicInfo, ISearchUser, IUserDocument } from '@user/interfaces/user.interface';
import { UserModel } from '@user/models/user.schema';
import mongoose from 'mongoose';
import { followService } from './follow.service';
import { indexOf } from 'lodash';
import { AuthModel } from '@auth/models/auth.schema';
import { ISocialLinks } from '@user/interfaces/user.interface';
import { INotification } from '@notification/interfaces/notification.interface';

class UserService {
  public async createUser(data: IUserDocument): Promise<void> {
    await UserModel.create(data);
  }

  public async getUserByAuthId(authId: string): Promise<IUserDocument> {
    const users: IUserDocument[] = await UserModel.aggregate([
      { $match: { authId: new mongoose.Types.ObjectId(authId) } },
      { $lookup: { from: 'Auth', localField: 'authId', foreignField: '_id', as: 'authData' } },
      { $unwind: '$authData' },
      { $project: this.aggregateProject() }
    ]);

    return users[0];
  }

  public async getUserById(userId: string): Promise<IUserDocument> {
    const users: IUserDocument[] = await UserModel.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(userId) } }, //cast string to ObjectId
      { $lookup: { from: 'Auth', localField: 'authId', foreignField: '_id', as: 'authData' } },
      { $unwind: '$authData' },
      { $project: this.aggregateProject() }
    ]);
    return users[0];
  }

  public async getAllUsers(userId: string, skip: number, limit: number): Promise<IUserDocument[]> {
    const userList: IUserDocument[] = await UserModel.aggregate([
      { $match: { $ne: { _id: new mongoose.Types.ObjectId(userId) } } },
      { $skip: skip },
      { $limit: limit },
      { $sort: { createdAt: -1 } },
      { $lookup: { from: 'Auth', localField: 'authId', foreignField: '_id', as: 'authData' } },
      { $unwind: '$authData' },
      { $project: this.aggregateProject() }
    ]);
    return userList;
  }

  public async getTotalUsersInDB(): Promise<number> {
    const totalCount: number = await UserModel.find({}).countDocuments();
    return totalCount;
  }

  public async getRandomUsers(userId: string): Promise<IUserDocument[]> {
    const randomUserList: IUserDocument[] = await UserModel.aggregate([
      { $match: { _id: { $ne: new mongoose.Types.ObjectId(userId) } } },
      { $sample: { size: 10 } },
      { $lookup: { from: 'Auth', localField: 'authId', foreignField: '_id', as: 'auth' } },
      { $unwind: '$auth' },
      {
        $addFields: {
          username: '$auth.username',
          email: '$auth.email',
          avatarColor: '$auth.avatarColor',
          uId: '$auth.uId',
          createdAt: '$auth.createdAt'
        }
      },
      {
        $project: {
          auth: 0,
          __v: 0
        }
      }
    ]);
    const excludeFollowerUserList: IUserDocument[] = [];
    const followers: string[] = await followService.getFollowersId(`${userId}`);
    for (const user of randomUserList) {
      const followerIndex = indexOf(followers, user._id.toString());
      if (followerIndex < 0) {
        excludeFollowerUserList.push(user);
      }
    }
    return excludeFollowerUserList;
  }

  public async searchUsers(regex: RegExp): Promise<ISearchUser[]> {
    const users = await AuthModel.aggregate([
      { $match: { username: regex } },
      { $lookup: { from: 'User', localField: '_id', foreignField: 'authId', as: 'user' } },
      { $unwind: '$user' },
      {
        $project: {
          _id: '$user._id',
          username: 1,
          email: 1,
          avatarColor: 1,
          profilePicture: 1
        }
      }
    ]);
    return users;
  }

  public async updatePwd(username: string, hashedNewPwd: string): Promise<void> {
    await AuthModel.updateOne({ username }, { $set: { password: hashedNewPwd } }).exec();
  }

  public async updateBasicInfo(userId: string, info: IBasicInfo): Promise<void> {
    await UserModel.updateOne(
      { _id: userId },
      {
        $set: {
          quote: info['quote'],
          work: info['work'],
          school: info['school'],
          location: info['location']
        }
      }
    ).exec();
  }

  public async updateSocialLinks(userId: string, socialLinks: ISocialLinks): Promise<void> {
    await UserModel.updateOne({ _id: userId }, { $set: { social: socialLinks } }).exec();
  }

  public async updateNotificationSettings(userId: string, notificationSettings: INotification): Promise<void> {
    await UserModel.updateOne({ _id: userId }, { $set: { notifications: notificationSettings } }).exec();
  }

  private aggregateProject() {
    //0 - excluded
    return {
      _id: 1,
      username: '$authData.username',
      uId: '$authData.uId',
      email: '$authData.email',
      avatarColor: '$authData.avatarColor',
      createdAt: '$authData.createdAt',
      postsCount: 1,
      work: 1,
      school: 1,
      quote: 1,
      location: 1,
      blocked: 1,
      blockedBy: 1,
      followersCount: 1,
      followingCount: 1,
      notifications: 1,
      social: 1,
      bgImageVersion: 1,
      bgImageId: 1,
      profilePicture: 1
    };
  }
}

export const userService: UserService = new UserService();
