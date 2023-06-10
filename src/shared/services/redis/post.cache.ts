import { ServerError } from '@global/helpers/errorHandler';
import { Helpers } from '@global/helpers/helpers';
import { IPostDocument, ISavePostToCache } from '@post/interfaces/post.interface';
import { config } from '@root/config';
import { BaseCache } from '@service/redis/base.cache';
import Logger from 'bunyan';
import { RedisCommandRawReply } from '@redis/client/dist/lib/commands';
import { IReactions } from '@reaction/interfaces/reaction.interface';

const log: Logger = config.createLogger('postCache');
export type PostCacheMultiType = string | number | Buffer | RedisCommandRawReply[] | IPostDocument | IPostDocument[];

export class PostCache extends BaseCache {
  constructor() {
    super('postCache');
  }

  public async savePostToCache(data: ISavePostToCache): Promise<void> {
    const { key, currentUserId, uId, createdPost } = data;
    const {
      _id,
      userId,
      username,
      email,
      avatarColor,
      profilePicture,
      post,
      bgColor,
      feelings,
      privacy,
      gifUrl,
      commentsCount,
      imgVersion,
      imgId,
      videoVersion,
      videoId,
      reactions,
      createdAt
    } = createdPost;

    const firstList: string[] = [
      '_id',
      `${_id}`,
      'userId',
      `${userId}`,
      'username',
      `${username}`,
      'email',
      `${email}`,
      'avatarColor',
      `${avatarColor}`,
      'profilePicture',
      `${profilePicture}`,
      'post',
      `${post}`,
      'bgColor',
      `${bgColor}`,
      'feelings',
      `${feelings}`,
      'privacy',
      `${privacy}`,
      'gifUrl',
      `${gifUrl}`
    ];

    const secondList: string[] = [
      'commentsCount',
      `${commentsCount}`,
      'reactions',
      JSON.stringify(reactions),
      'imgVersion',
      `${imgVersion}`,
      'imgId',
      `${imgId}`,
      'createdAt',
      `${createdAt}`,
      'videoVersion',
      `${videoVersion}`,
      'videoId',
      `${videoId}`
    ];
    const dataToSave: string[] = [...firstList, ...secondList];

    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const postsCount: string[] = await this.client.HMGET(`users:${currentUserId}`, 'postsCount');
      const multi: ReturnType<typeof this.client.multi> = this.client.multi();
      multi.ZADD('post', { score: parseInt(uId, 10), value: `${key}` });
      for (let i = 0; i < dataToSave.length; i += 2) {
        multi.HSET(`posts:${key}`, dataToSave[i], dataToSave[i + 1]);
      }

      const count: number = parseInt(postsCount[0], 10) + 1;
      multi.HSET(`posts:${key}`, 'postsCount', count);

      multi.exec();
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async getPostsFromCache(key: string, start: number, end: number): Promise<IPostDocument[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const result: string[] = await this.client.ZRANGE(key, start, end); //windows can't use REV
      const multi: ReturnType<typeof this.client.multi> = this.client.multi();
      for (let i = result.length - 1; i >= 0; i--) {
        //reverse to get lastest
        multi.HGETALL(`posts:${result[i]}`);
      }
      const results: PostCacheMultiType = (await multi.exec()) as PostCacheMultiType;
      const postResults: IPostDocument[] = [];
      for (const post of results as IPostDocument[]) {
        post.commentsCount = Helpers.customJsonParse(`${post.commentsCount}`) as number;
        post.reactions = Helpers.customJsonParse(`${post.reactions}`) as IReactions;
        post.createdAt = new Date(Helpers.customJsonParse(`${post.createdAt}`)) as Date;
        postResults.push(post);
      }

      return postResults;
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async getPostsWithImagesFromCache(key: string, start: number, end: number): Promise<IPostDocument[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const result: string[] = await this.client.ZRANGE(key, start, end); //windows can't use REV
      const multi: ReturnType<typeof this.client.multi> = this.client.multi();
      for (let i = result.length - 1; i >= 0; i--) {
        //reverse to get lastest
        multi.HGETALL(`posts:${result[i]}`);
      }
      const results: PostCacheMultiType = (await multi.exec()) as PostCacheMultiType;
      const postsWithImages: IPostDocument[] = [];
      for (const post of results as IPostDocument[]) {
        if ((post.imgId && post.imgVersion) || post.gifUrl) {
          //if those porpeties exist - true
          post.commentsCount = Helpers.customJsonParse(`${post.commentsCount}`) as number;
          post.reactions = Helpers.customJsonParse(`${post.reactions}`) as IReactions;
          post.createdAt = new Date(Helpers.customJsonParse(`${post.createdAt}`)) as Date;
          postsWithImages.push(post);
        }
      }

      return postsWithImages;
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async getPostsWithVideoFromCache(key: string, start: number, end: number): Promise<IPostDocument[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const result: string[] = await this.client.ZRANGE(key, start, end); //windows can't use REV
      const multi: ReturnType<typeof this.client.multi> = this.client.multi();
      for (let i = result.length - 1; i >= 0; i--) {
        //reverse to get lastest
        multi.HGETALL(`posts:${result[i]}`);
      }
      const results: PostCacheMultiType = (await multi.exec()) as PostCacheMultiType;
      const postsWithVideos: IPostDocument[] = [];
      for (const post of results as IPostDocument[]) {
        if (post.videoId && post.videoVersion) {
          //if those porpeties exist - true
          post.commentsCount = Helpers.customJsonParse(`${post.commentsCount}`) as number;
          post.reactions = Helpers.customJsonParse(`${post.reactions}`) as IReactions;
          post.createdAt = new Date(Helpers.customJsonParse(`${post.createdAt}`)) as Date;
          postsWithVideos.push(post);
        }
      }

      return postsWithVideos;
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async getTotalPostsInCache(): Promise<number> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const count: number = await this.client.ZCARD('post');

      return count;
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  //to get posts for a single user
  public async getUserPostsFromCache(key: string, uId: number): Promise<IPostDocument[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const result: string[] = await this.client.ZRANGE(key, uId, uId);
      const reversedResult = result.reverse();
      const multi: ReturnType<typeof this.client.multi> = this.client.multi();
      for (const value of reversedResult) {
        multi.HGETALL(`posts:${value}`);
      }
      const results: PostCacheMultiType = (await multi.exec()) as PostCacheMultiType;
      const userPostResults: IPostDocument[] = [];
      for (const post of results as IPostDocument[]) {
        post.commentsCount = Helpers.customJsonParse(`${post.commentsCount}`) as number;
        post.reactions = Helpers.customJsonParse(`${post.reactions}`) as IReactions;
        post.createdAt = new Date(Helpers.customJsonParse(`${post.createdAt}`)) as Date;
        userPostResults.push(post);
      }
      return userPostResults;
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  //to get the number of posts for a single user
  public async getTotalUserPostsInCache(uId: number): Promise<number> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      const count: number = await this.client.ZCOUNT('post', uId, uId);
      return count;
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async deletePostFromCache(postId: string, currentUserId: string): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const postCount: string[] = await this.client.HMGET(`users:${currentUserId}`, 'postsCount');
      const multi: ReturnType<typeof this.client.multi> = this.client.multi();
      multi.ZREM('post', `${postId}`);
      multi.DEL(`posts:${postId}`);
      multi.DEL(`comments:${postId}`);
      multi.DEL(`reactions:${postId}`);
      const count: number = parseInt(postCount[0], 10) - 1;
      multi.HSET(`users:${currentUserId}`, 'postsCount', count);
      await multi.exec();
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async updatePostInCache(key: string, updatedpost: IPostDocument): Promise<IPostDocument> {
    const { post, bgColor, feelings, privacy, gifUrl, imgVersion, imgId, profilePicture, videoId, videoVersion } = updatedpost;
    const dataToSave: string[] = [
      'post',
      `${post}`,
      'bgColor',
      `${bgColor}`,
      'feelings',
      `${feelings}`,
      'privacy',
      `${privacy}`,
      'gifUrl',
      `${gifUrl}`,
      'imgVersion',
      `${imgVersion}`,
      'imgId',
      `${imgId}`,
      'profilePicture',
      `${profilePicture}`,
      'videoId',
      `${videoId}`,
      'videoVersion',
      `${videoVersion}`
    ];
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      // await this.client.HSET(`posts:${key}`, dataToSave);
      for (let i = 0; i < dataToSave.length; i += 2) {
        await this.client.HSET(`posts:${key}`, dataToSave[i], dataToSave[i + 1]);
      }

      const multi: ReturnType<typeof this.client.multi> = this.client.multi();
      multi.HGETALL(`posts:${key}`);
      const result: PostCacheMultiType = (await multi.exec()) as PostCacheMultiType;
      const postResult = result as IPostDocument[];
      postResult[0].commentsCount = Helpers.customJsonParse(`${postResult[0].commentsCount}`) as number;
      postResult[0].reactions = Helpers.customJsonParse(`${postResult[0].reactions}`) as IReactions;
      postResult[0].createdAt = Helpers.customJsonParse(`${postResult[0].createdAt}`) as Date;

      return postResult[0];
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }
}
