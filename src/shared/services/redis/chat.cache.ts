import { BaseCache } from '@service/redis/base.cache';
import { config } from '@root/config';
import Logger from 'bunyan';
import { ServerError } from '@global/helpers/errorHandler';
import { filter, find, findIndex, remove } from 'lodash';
import { IChatList, IChatUsers, IGetMessageFromCache, IMessageData } from '@chat/interfaces/chat.interface';
import { Helpers } from '@global/helpers/helpers';
import { IReaction } from '@reaction/interfaces/reaction.interface';

const log: Logger = config.createLogger('chatCache');

export class ChatCache extends BaseCache {
  constructor() {
    super('chatCache');
  }

  public async addChatListToCache(senderId: string, receiverId: string, conversationId: string): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const userChatList = await this.client.LRANGE(`chatList:${senderId}`, 0, -1);
      if (userChatList.length === 0) {
        await this.client.RPUSH(`chatList:${senderId}`, JSON.stringify({ receiverId, conversationId }));
      } else {
        const receiverIndex: number = findIndex(userChatList, (listItem: string) => listItem.includes(receiverId));
        if (receiverIndex < 0) {
          await this.client.RPUSH(`chatList:${senderId}`, JSON.stringify({ receiverId, conversationId }));
        }
      }
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async addChatMessageToCache(conversationId: string, massageData: IMessageData): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      await this.client.RPUSH(`messages:${conversationId}`, JSON.stringify(massageData));
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  //List chatUsers - used to know whether the user in chat page
  public async addChatUserToCache(value: IChatUsers): Promise<IChatUsers[]> {
    try {
      if (!this.client.isOpen) {
        this.client.connect();
      }

      const chatUsers: IChatUsers[] = await this.getChatUserFromCache();
      //if already existed, don't need to add
      const userIndex: number = findIndex(chatUsers, (item: IChatUsers) => JSON.stringify(item) === JSON.stringify(value));
      let chatUserList: IChatUsers[] = [];
      //equals -1 meaning not exist
      if (userIndex < 0) {
        await this.client.RPUSH('chatUsers', JSON.stringify(value));
        chatUserList = await this.getChatUserFromCache();
      } else {
        chatUserList = chatUsers;
      }
      return chatUserList;
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async removeChatUserFromCache(value: IChatUsers): Promise<IChatUsers[]> {
    try {
      if (!this.client.isOpen) {
        this.client.connect();
      }

      const chatUsers: IChatUsers[] = await this.getChatUserFromCache();
      const userIndex: number = findIndex(chatUsers, (item: IChatUsers) => JSON.stringify(item) === JSON.stringify(value));
      let chatUserList: IChatUsers[] = [];
      if (userIndex > -1) {
        await this.client.LREM('chatUsers', userIndex, JSON.stringify(value));
        chatUserList = await this.getChatUserFromCache();
      } else {
        chatUserList = chatUsers;
      }
      return chatUserList;
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async getLastMessages(key: string): Promise<IMessageData[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      //get chat list of single user
      const chatList: string[] = await this.client.LRANGE(`chatList:${key}`, 0, -1);
      const LastMessageList: IMessageData[] = [];
      //use conversationId to retrive last message of every conversation
      for (const item of chatList) {
        const chatItem: IChatList = Helpers.customJsonParse(item) as IChatList;
        const messageItem: string = (await this.client.LINDEX(`messages:${chatItem.conversationId}`, -1)) as string;
        LastMessageList.push(Helpers.customJsonParse(messageItem));
      }
      return LastMessageList;
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  //step1 - use senderId to get receiver
  //step2 - use conversationId inside the receiver to get messages
  public async getChatMessages(senderId: string, receiverId: string): Promise<IMessageData[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const recevierList: string[] = await this.client.LRANGE(`chatList:${senderId}`, 0, -1);
      //receiver data format - 	{"receiverId":"xxx","conversationId":"xxx"}
      const receiver: string = find(recevierList, (item: string) => item.includes(receiverId)) as string;

      const parsedReceiver: IChatList = Helpers.customJsonParse(receiver);
      if (parsedReceiver) {
        const messageList: string[] = await this.client.LRANGE(`messages:${parsedReceiver.conversationId}`, 0, -1);
        const chatMessages: IMessageData[] = [];
        for (const item of messageList) {
          chatMessages.push(Helpers.customJsonParse(item));
        }
        return chatMessages;
      } else {
        return [];
      }
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async markMessageAsDeleted(senderId: string, receiverId: string, messageId: string, type: string): Promise<IMessageData> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      const { index, message, receiver } = await this.getMessage(senderId, receiverId, messageId);
      const messageItem = Helpers.customJsonParse(message) as IMessageData;
      if (type === 'deleteForMe') {
        messageItem.deleteForMe = true;
      } else {
        messageItem.deleteForMe = true;
        messageItem.deleteForEveryone = true;
      }
      await this.client.LSET(`messages:${receiver.conversationId}`, index, JSON.stringify(messageItem));

      //send back the deleted message item
      const deletedMessage: string = (await this.client.LINDEX(`messages:${receiver.conversationId}`, index)) as string;
      return Helpers.customJsonParse(deletedMessage) as IMessageData;
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async updateMessagesStatusInCache(senderId: string, receiverId: string): Promise<IMessageData> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const recevierList: string[] = await this.client.LRANGE(`chatList:${senderId}`, 0, -1);
      //receiver data format - 	{"receiverId":"xxx","conversationId":"xxx"}
      const receiver: string = find(recevierList, (item: string) => item.includes(receiverId)) as string;
      const parsedReceiver: IChatList = Helpers.customJsonParse(receiver) as IChatList;

      const messageList: string[] = await this.client.LRANGE(`messages:${parsedReceiver.conversationId}`, 0, -1);
      const unReadMessageList: string[] = filter(messageList, (item: string) => !Helpers.customJsonParse(item).isRead);
      for (const item of unReadMessageList) {
        const parsedItem: IMessageData = Helpers.customJsonParse(item);
        const index: number = findIndex(messageList, (listItem: string) => listItem.includes(`${parsedItem._id}`));
        parsedItem.isRead = true;
        await this.client.LSET(`messages:${parsedItem.conversationId}`, index, JSON.stringify(parsedItem));
      }
      const lastMessage: string = (await this.client.LINDEX(`messages:${parsedReceiver.conversationId}`, -1)) as string;
      return Helpers.customJsonParse(lastMessage) as IMessageData;
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async updateMsgReactionInCache(
    conversationId: string,
    messageId: string,
    senderName: string,
    reaction: string,
    type: 'add' | 'remove'
  ): Promise<IMessageData> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const messageList: string[] = await this.client.LRANGE(`messages:${conversationId}`, 0, -1);
      const messageIndex: number = findIndex(messageList, (item: string) => item.includes(messageId));
      const message: string = (await this.client.LINDEX(`messages:${conversationId}`, messageIndex)) as string;
      const parsedMessage: IMessageData = Helpers.customJsonParse(message);
      const reactions: IReaction[] = [];
      if (parsedMessage) {
        remove(parsedMessage.reaction, (reaction: IReaction) => reaction.senderName === senderName);
        if (type === 'add') {
          reactions.push({ senderName, type: reaction });
          parsedMessage.reaction = [...reactions, ...parsedMessage.reaction];
          await this.client.LSET(`messages:${conversationId}`, messageIndex, JSON.stringify(parsedMessage));
        } else {
          await this.client.LSET(`messages:${conversationId}`, messageIndex, JSON.stringify(parsedMessage));
        }
      }
      const updatedMessage: string = (await this.client.LINDEX(`messages:${conversationId}`, messageIndex)) as string;
      return Helpers.customJsonParse(updatedMessage) as IMessageData;
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  private async getChatUserFromCache(): Promise<IChatUsers[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const chatUserList: IChatUsers[] = [];
      const chatUsers: string[] = await this.client.LRANGE('chatUsers', 0, -1);
      for (const item of chatUsers) {
        const res: IChatUsers = Helpers.customJsonParse(item) as IChatUsers;
        chatUserList.push(res);
      }
      return chatUserList;
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  private async getMessage(senderId: string, receiverId: string, messageId: string): Promise<IGetMessageFromCache> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const chatList: string[] = await this.client.LRANGE(`chatList:${senderId}`, 0, 1);
      const recevier: string = find(chatList, (item: string) => item.includes(receiverId)) as string;
      const parsedReceiver: IChatList = Helpers.customJsonParse(recevier);

      const messageList: string[] = await this.client.LRANGE(`messages:${parsedReceiver.conversationId}`, 0, 1);
      const message: string = find(messageList, (item: string) => item.includes(messageId)) as string;
      const index: number = findIndex(messageList, (item: string) => item.includes(messageId));

      return { index, message, receiver: parsedReceiver };
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }
}
