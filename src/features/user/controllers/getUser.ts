import { IFollowData } from '@follow/interfaces/follow.interface';
import { followService } from '@service/db/follow.service';
import { userService } from '@service/db/user.service';
import { FollowCache } from '@service/redis/follow.cache';
import { UserCache } from '@service/redis/user.cache';
import { IAllUsers, IUserDocument } from '@user/interfaces/user.interface';
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import HTTP_STATUS from 'http-status-codes';
import { Helpers } from '@global/helpers/helpers';
import { IPostDocument } from '@post/interfaces/post.interface';
import { PostCache } from '@service/redis/post.cache';
import { postService } from '@service/db/post.service';

interface IUserAll {
  skip: number;
  limit: number;
  start: number;
  end: number;
  userId: string;
}

const PAGE_SIZE = 12;
const userCache: UserCache = new UserCache();
const followCache: FollowCache = new FollowCache();
const postCache: PostCache = new PostCache();

export class GetUsers {
  public async getUsers(req: Request, res: Response): Promise<void> {
    const { page } = req.params;
    const skip: number = (parseInt(page) - 1) * PAGE_SIZE; //mongodb 0 - 10, 10 - 20
    const limit: number = parseInt(page) * PAGE_SIZE;
    const start: number = skip === 0 ? skip : skip + 1; //redis 0 - 10, 11 - 20
    const end: number = parseInt(page) * PAGE_SIZE;

    const allUsers: IAllUsers = await GetUsers.prototype.getAllUsers({ skip, limit, start, end, userId: `${req.currentUser?.userId}` });
    const followees: IFollowData[] = await GetUsers.prototype.getFollowees(`${req.currentUser?.userId}`);
    res.status(HTTP_STATUS.OK).json({ message: 'Get users', users: allUsers.users, totalUsers: allUsers.totalUsers, followees });
  }

  //get login user profile
  public async getCurrentUserProfile(req: Request, res: Response): Promise<void> {
    const cachedCurrentUser: IUserDocument = (await userCache.getUserFromCache(`${req.currentUser?.userId}`)) as IUserDocument;
    const currentUser: IUserDocument = cachedCurrentUser ? cachedCurrentUser : await userService.getUserById(`${req.currentUser?.userId}`);
    res.status(HTTP_STATUS.OK).json({ message: 'Get user profile', user: currentUser });
  }

  //get other users' profile
  public async getProfileByUserId(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const cachedUser: IUserDocument = (await userCache.getUserFromCache(userId)) as IUserDocument;
    const existingUser: IUserDocument = cachedUser ? cachedUser : await userService.getUserById(userId);
    res.status(HTTP_STATUS.OK).json({ message: 'Get user profile by id', user: existingUser });
  }

  public async getProfileAndPosts(req: Request, res: Response): Promise<void> {
    const { userId, username, uId } = req.params;
    const userName: string = Helpers.firstLetterUppercase(username);
    const cachedUser: IUserDocument = (await userCache.getUserFromCache(userId)) as IUserDocument;
    const cachedUserPosts: IPostDocument[] = await postCache.getUserPostsFromCache('post', parseInt(uId, 10));

    const existingUser: IUserDocument = cachedUser ? cachedUser : await userService.getUserById(userId);
    const userPosts: IPostDocument[] = cachedUserPosts.length
      ? cachedUserPosts
      : await postService.getPosts({ username: userName }, 0, 100, { createdAt: -1 });

    res.status(HTTP_STATUS.OK).json({ message: 'Get user profile and posts', user: existingUser, posts: userPosts });
  }

  public async getRandomUsers(req: Request, res: Response): Promise<void> {
    const cachedRandomUserList: IUserDocument[] = await userCache.getRandomUsers(
      `${req.currentUser?.userId}`,
      `${req.currentUser?.username}`
    );
    const randomUserList: IUserDocument[] = cachedRandomUserList.length
      ? cachedRandomUserList
      : await userService.getRandomUsers(`${req.currentUser?.userId}`);

    res.status(HTTP_STATUS.OK).json({ message: 'User suggestions', users: randomUserList });
  }

  private async getAllUsers({ skip, limit, start, end, userId }: IUserAll): Promise<IAllUsers> {
    let users;
    let type = '';
    const cachedUsers: IUserDocument[] = (await userCache.getUsersFromCache(start, end, userId)) as IUserDocument[];
    if (cachedUsers.length) {
      type = 'redis';
      users = cachedUsers;
    } else {
      type = 'mongodb';
      users = await userService.getAllUsers(userId, skip, limit);
    }
    const totalUsers: number = await GetUsers.prototype.usersCount(type);
    return { users, totalUsers };
  }

  private async usersCount(type: string): Promise<number> {
    const totalUsers: number = type === 'redis' ? await userCache.getTotalUsersInCache() : await userService.getTotalUsersInDB();
    return totalUsers;
  }

  private async getFollowees(userId: string): Promise<IFollowData[]> {
    const cachedFollowees: IFollowData[] = await followCache.getFollowerOrFolloweeFromCache(`followersOf:${userId}`);
    const result = cachedFollowees.length ? cachedFollowees : await followService.getFollowerFromDB(new mongoose.Types.ObjectId(userId));
    return result;
  }
}
