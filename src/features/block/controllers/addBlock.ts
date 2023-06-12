import HTTP_STATUS from 'http-status-codes';
import { Request, Response } from 'express';
import { BlockCache } from '@service/redis/block.cache';
import { blockQueue } from '@service/queues/block.queue';

const blockCache: BlockCache = new BlockCache();

export class AddBlock {
  public async addBlock(req: Request, res: Response): Promise<void> {
    const { blockedUserId } = req.params;
    await blockCache.updateBlockInCache(`${req.currentUser?.userId}`, 'blocked', blockedUserId, 'block');
    await blockCache.updateBlockInCache(blockedUserId, 'blockedBy', `${req.currentUser?.userId}`, 'block');
    blockQueue.addBlockJob('updateBlockInDB', { userId: `${req.currentUser?.userId}`, blockedUserId, type: 'block' });
    res.status(HTTP_STATUS.OK).json({ message: 'User blocked' });
  }
}
