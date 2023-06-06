import { IMessageData } from '@chat/interfaces/chat.interface';
import { chatQueue } from '@service/queues/chat.queue';
import { ChatCache } from '@service/redis/chat.cache';
import { chatSocketIOObject } from '@socket/chat.socket';
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import HTTP_STATUS from 'http-status-codes';

const chatCache: ChatCache = new ChatCache();

export class AddMessageReaction {
  public async addMessageReaction(req: Request, res: Response): Promise<void> {
    const { conversationId, messageId, reaction, type } = req.body;
    const updatedMsg: IMessageData = await chatCache.updateMsgReactionInCache(
      conversationId,
      messageId,
      `${req.currentUser?.username}`,
      reaction,
      type
    );
    chatSocketIOObject.emit('message reaction', updatedMsg);
    chatQueue.addChatJob('updateMsgReactionInDB', {
      messageId: new mongoose.Types.ObjectId(messageId),
      reaction,
      senderName: `${req.currentUser?.username}`,
      type
    });

    res.status(HTTP_STATUS.OK).json({ message: 'Message reaction added' });
  }
}
