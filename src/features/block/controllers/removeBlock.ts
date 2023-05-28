import HTTP_STATUS from 'http-status-codes';
import { Request, Response } from 'express';
import { BlockCache } from '@service/redis/block.cache';
import { blockQueue } from '@service/queues/block.queue';

const blockCache: BlockCache = new BlockCache();

export class RemoveBlock{
  public async removeBlock(req: Request, res: Response): Promise<void>{
    const { blockedUserId } = req.params;
    await blockCache.updateBlockInCache(`${req.currentUser?.userId}`, 'blocked', blockedUserId, 'unblock');
    await blockCache.updateBlockInCache(blockedUserId, 'blockedBy', `${req.currentUser?.userId}`, 'unblock');
    blockQueue.addBlockJob('updateBlockInDB', { userId: `${req.currentUser?.userId}`, blockedUserId, type: 'unblock'});
    res.status(HTTP_STATUS.OK).json({ message: 'User unblocked' });
  }
}
