import HTTP_STATUS from 'http-status-codes';
import { IMessageData } from '@chat/interfaces/chat.interface';
import { chatService } from '@service/db/chat.service';
import { ChatCache } from '@service/redis/chat.cache';
import { Request, Response } from 'express';
import mongoose from 'mongoose';

const chatCache: ChatCache = new ChatCache();

export class GetChatMessage {
  public async getLastChatMessages(req: Request, res: Response): Promise<void> {
    const lastMessages: IMessageData[] = await chatCache.getLastMessages(`${req.currentUser?.userId}`);
    let lastMessageList: IMessageData[] = [];
    if (lastMessages.length === 0) {
      lastMessageList = await chatService.getLastMessagesFromDB(new mongoose.Types.ObjectId(req.currentUser!.userId));
    } else {
      lastMessageList = lastMessages;
    }
    res.status(HTTP_STATUS.OK).json({ message: 'User conversation list', lastMessageList });
  }

  public async getChatMessages(req: Request, res: Response): Promise<void> {
    const { receiverId } = req.params;
    let messageList: IMessageData[] = [];
    const cachedMessageList: IMessageData[] = await chatCache.getChatMessages(`${req.currentUser?.userId}`, receiverId);
    if (cachedMessageList.length === 0) {
      messageList = await chatService.getMessageListFromDB(
        new mongoose.Types.ObjectId(`${req.currentUser?.userId}`),
        new mongoose.Types.ObjectId(receiverId),
        { createdAt: 1 }
      );
    } else {
      messageList = cachedMessageList;
    }

    res.status(HTTP_STATUS.OK).json({ message: 'User chat messages', messageList });
  }
}
