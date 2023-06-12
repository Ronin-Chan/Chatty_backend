import { ICommentDocument, ICommentNameList } from '@comment/interfaces/comment.interface';
import { ServerError } from '@global/helpers/errorHandler';
import { config } from '@root/config';
import { BaseCache } from '@service/redis/base.cache';
import Logger from 'bunyan';
import { Helpers } from '@global/helpers/helpers';
import { find } from 'lodash';

const log: Logger = config.createLogger('commentCache');

export class CommentCache extends BaseCache {
  constructor() {
    super('commentCache');
  }

  public async savePostCommentToCache(postId: string, comment: ICommentDocument): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      await this.client.LPUSH(`comments:${postId}`, JSON.stringify(comment));
      const commentsCount: string[] = await this.client.HMGET(`posts:${postId}`, 'commentsCount');
      const count: number = parseInt(commentsCount[0], 10) + 1;
      await this.client.HSET(`posts:${postId}`, 'commentsCount', count);
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async getCommentsFromCache(postId: string): Promise<ICommentDocument[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const result: string[] = await this.client.LRANGE(postId, 0, -1);
      const commentResults: ICommentDocument[] = [];
      for (const comment of result) {
        commentResults.push(Helpers.customJsonParse(comment));
      }

      return commentResults;
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  //get all username who commented the single post
  public async getCommentsNamesFromCache(postId: string): Promise<ICommentNameList[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      const commentsCount: number = await this.client.LLEN(`comments:${postId}`);
      const comments: string[] = await this.client.LRANGE(`comments:${postId}`, 0, -1);
      const nameList: string[] = [];
      for (const item of comments) {
        const comment: ICommentDocument = Helpers.customJsonParse(item) as ICommentDocument;
        nameList.push(comment.username);
      }
      const result: ICommentNameList = {
        count: commentsCount,
        names: nameList
      };
      return [result]; //result[0] - count, result[1] - nameList
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  //get single comment of single post by commentId
  public async getSingleCommentFromCache(postId: string, commentId: string): Promise<ICommentDocument[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      const comments: string[] = await this.client.LRANGE(`comments:${postId}`, 0, -1);
      const list: ICommentDocument[] = [];
      for (const item of comments) {
        list.push(Helpers.customJsonParse(item));
      }
      const result: ICommentDocument = find(list, (listItem: ICommentDocument) => {
        return listItem._id === commentId;
      }) as ICommentDocument;

      return [result];
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }
}
