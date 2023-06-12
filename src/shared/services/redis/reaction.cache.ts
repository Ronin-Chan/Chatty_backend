import { ServerError } from '@global/helpers/errorHandler';
import { Helpers } from '@global/helpers/helpers';
import { config } from '@root/config';
import { BaseCache } from '@service/redis/base.cache';
import Logger from 'bunyan';
import { IReactionDocument, IReactions } from '@reaction/interfaces/reaction.interface';
import { find } from 'lodash';

const log: Logger = config.createLogger('reactionCache');

export class ReactionCache extends BaseCache {
  constructor() {
    super('reactionCache');
  }

  public async savePostReactionToCache(
    key: string,
    reaction: IReactionDocument,
    postReactions: IReactions,
    type: string,
    previousReaction: string
  ): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      if (previousReaction) {
        this.removePostReactionFromCache(key, reaction.username, postReactions);
      }

      if (type) {
        await this.client.LPUSH(`reactions:${key}`, JSON.stringify(reaction));
        await this.client.HSET(`posts:${key}`, 'reactions', JSON.stringify(postReactions));
      }
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async removePostReactionFromCache(key: string, username: string, postReactions: IReactions): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const result: string[] = await this.client.LRANGE(`reactions:${key}`, 0, -1);
      const multi: ReturnType<typeof this.client.multi> = this.client.multi();
      const userPreviousReaction: IReactionDocument = this.getPreviousReaction(result, username) as IReactionDocument;
      multi.LREM(`reactions:${key}`, 1, JSON.stringify(userPreviousReaction));
      await multi.exec();

      await this.client.HSET(`posts:${key}`, 'reactions', JSON.stringify(postReactions));
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  private getPreviousReaction(result: string[], username: string): IReactionDocument | undefined {
    const list: IReactionDocument[] = [];
    for (const item of result) {
      list.push(Helpers.customJsonParse(item) as IReactionDocument);
    }
    return find(list, (listItem: IReactionDocument) => {
      return listItem.username === username;
    });
  }

  public async getPostReactionsFromCache(postId: string): Promise<[IReactionDocument[], number]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const reactionCount: number = await this.client.LLEN(`reactions:${postId}`);
      const result: string[] = await this.client.LRANGE(`reactions:${postId}`, 0, -1);
      const reactionList: IReactionDocument[] = [];
      for (const item of result) {
        reactionList.push(Helpers.customJsonParse(item));
      }

      return result.length ? [reactionList, reactionCount] : [[], 0];
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async getSinglePostReactionByUsernameFromCache(postId: string, username: string): Promise<[IReactionDocument, number] | []> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const result: string[] = await this.client.LRANGE(`reactions:${postId}`, 0, -1);
      const reactionList: IReactionDocument[] = [];
      for (const item of result) {
        reactionList.push(Helpers.customJsonParse(item));
      }

      const reaction: IReactionDocument = find(reactionList, (listItem: IReactionDocument) => {
        return listItem.username === username && listItem.postId === postId;
      }) as IReactionDocument;

      return reaction ? [reaction, 1] : [];
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }
}
