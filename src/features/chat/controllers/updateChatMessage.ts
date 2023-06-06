import HTTP_STATUS from 'http-status-codes';
import { IMessageData } from '@chat/interfaces/chat.interface';
import { ChatCache } from '@service/redis/chat.cache';
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { chatQueue } from '@service/queues/chat.queue';
import { chatSocketIOObject } from '@socket/chat.socket';
import { joiValidation } from '@global/decorators/joiValidation.decorators';
import { markChatSchema } from '@chat/schemes/chat.schemes';

const chatCache: ChatCache = new ChatCache();

export class UpdateChatMessage {
  @joiValidation(markChatSchema)
  public async updateChatMessages(req: Request, res: Response): Promise<void> {
    const { senderId, receiverId } = req.body;
    const lastMessage: IMessageData = await chatCache.updateMessagesStatusInCache(senderId, receiverId);
    chatSocketIOObject.emit('message read', lastMessage);
    chatSocketIOObject.emit('chat list', lastMessage);
    chatQueue.addChatJob('markMessageAsReadInDB', {
      senderId: new mongoose.Types.ObjectId(senderId),
      receiverId: new mongoose.Types.ObjectId(receiverId)
    });

    res.status(HTTP_STATUS.OK).json({ message: 'Message marked as read' });
  }
}
