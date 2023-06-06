import HTTP_STATUS from 'http-status-codes';
import { IMessageData } from '@chat/interfaces/chat.interface';
import { ChatCache } from '@service/redis/chat.cache';
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { chatQueue } from '@service/queues/chat.queue';
import { chatSocketIOObject } from '@socket/chat.socket';

const chatCache: ChatCache = new ChatCache();

export class DeleteChatMessage {
  public async deleteChatMessage(req: Request, res: Response): Promise<void> {
    const { senderId, receiverId, messageId, type } = req.params;
    const deletedMessage: IMessageData = await chatCache.markMessageAsDeleted(senderId, receiverId, messageId, type);
    chatSocketIOObject.emit('message read', deletedMessage);
    chatSocketIOObject.emit('chat list', deletedMessage);
    chatQueue.addChatJob('markMessageAsDeletedInDB', { messageId: new mongoose.Types.ObjectId(messageId), type });

    res.status(HTTP_STATUS.OK).json({ message: 'Message marked as deleted' });
  }
}
