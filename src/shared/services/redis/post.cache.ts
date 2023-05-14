import { ServerError } from '@global/helpers/errorHandler';
import { Helpers } from '@global/helpers/helpers';
import { IPostDocument, IReactions, ISavePostToCache } from '@post/interfaces/post.interface';
import { config } from '@root/config';
import { BaseCache } from '@service/redis/base.cache';
import Logger from 'bunyan';
import { RedisCommandRawReply } from '@redis/client/dist/lib/commands';

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
      `${createdAt}`
    ];
    const dataToSave: string[] = [...firstList, ...secondList];

    try {
      if(!this.client.isOpen){
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

  public async getPostsFromCache(key: string, start: number, end: number): Promise<IPostDocument[]>{
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const result: string[] = await this.client.ZRANGE(key, start, end); //windows can't use REV
      const multi: ReturnType<typeof this.client.multi> = this.client.multi();
      for (let i = result.length - 1; i >= 0; i--) { //reverse to get lastest
        multi.HGETALL(`posts:${result[i]}`);
      }
      const results: PostCacheMultiType = (await multi.exec()) as PostCacheMultiType;
      const postResults: IPostDocument[] = [];
      for(const post of results as IPostDocument[]){
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
      for (let i = result.length - 1; i >= 0; i--) { //reverse to get lastest
        multi.HGETALL(`posts:${result[i]}`);
      }
      const results: PostCacheMultiType = (await multi.exec()) as PostCacheMultiType;
      const postWithImages: IPostDocument[] = [];
      for (const post of results as IPostDocument[]) {
        if ((post.imgId && post.imgVersion) || post.gifUrl) { //if those porpeties exist - true
          post.commentsCount = Helpers.customJsonParse(`${post.commentsCount}`) as number;
          post.reactions = Helpers.customJsonParse(`${post.reactions}`) as IReactions;
          post.createdAt = new Date(Helpers.customJsonParse(`${post.createdAt}`)) as Date;
          postWithImages.push(post);
        }
      }

      return postWithImages;

    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async getTotalPostsInCache(): Promise<number>{
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

      const result: string[] = await this.client.ZRANGE(key, uId, uId, { REV: true, BY: 'SCORE' });
      const multi: ReturnType<typeof this.client.multi> = this.client.multi();
      for (const value of result) {
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

  public async deletePostFromCache(postId: string, currentUserId: string): Promise<void>{
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

  public async updatePostInCache(key: string, updatedpost: IPostDocument): Promise<IPostDocument>{
    const { post, bgColor, feelings, privacy, gifUrl, imgVersion, imgId, profilePicture } = updatedpost;
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
    ];
    try {
      if(!this.client.isOpen){
        await this.client.connect();
      }
      // await this.client.HSET(`posts:${key}`, dataToSave);
      for (let i = 0; i < dataToSave.length; i += 2) {
        await this.client.HSET(`posts:${key}`, dataToSave[i], dataToSave[i + 1]);
      }

      const multi: ReturnType<typeof this.client.multi> = this.client.multi();
      multi.HGETALL(`posts:${key}`);
      const result: PostCacheMultiType = await multi.exec() as PostCacheMultiType;
      const postResult = result as IPostDocument;
      postResult.commentsCount = Helpers.customJsonParse(`${postResult.commentsCount}`) as number;
      postResult.reactions = Helpers.customJsonParse(`${postResult.reactions}`) as IReactions;
      postResult.createdAt = Helpers.customJsonParse(`${postResult.createdAt}`) as Date;

      return postResult;
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }
}
