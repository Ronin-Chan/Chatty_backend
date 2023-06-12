import { IMessageData } from '@chat/interfaces/chat.interface';
import { IConversationDocument } from '@chat/interfaces/conversation.interface';
import { MessageModel } from '@chat/models/chat.schema';
import { ConversationModel } from '@chat/models/conversation.schema';
import { ObjectId } from 'mongodb';

class ChatService {
  public async addChatMessageToDB(data: IMessageData): Promise<void> {
    const conversation: IConversationDocument[] = await ConversationModel.find({ _id: data?.conversationId }).exec();
    if (conversation.length === 0) {
      ConversationModel.create({
        _id: data.conversationId,
        senderId: data.senderId,
        receiverId: data.receiverId
      });
    }

    await MessageModel.create({
      _id: data._id,
      conversationId: data.conversationId,
      receiverId: data.receiverId,
      receiverUsername: data.receiverUsername,
      receiverAvatarColor: data.receiverAvatarColor,
      receiverProfilePicture: data.receiverProfilePicture,
      senderUsername: data.senderUsername,
      senderId: data.senderId,
      senderAvatarColor: data.senderAvatarColor,
      senderProfilePicture: data.senderProfilePicture,
      body: data.body,
      isRead: data.isRead,
      gifUrl: data.gifUrl,
      selectedImage: data.selectedImage,
      reaction: data.reaction,
      createdAt: data.createdAt
    });
  }

  //id must be type of ObjectId. If it's string, we can't get any result.
  public async getLastMessagesFromDB(userId: ObjectId): Promise<IMessageData[]> {
    const lastMessageList: IMessageData[] = await MessageModel.aggregate([
      { $match: { $or: [{ senderId: userId }, { receiverId: userId }] } },
      {
        $group: {
          _id: '$conversationId',
          result: { $last: '$$ROOT' }
        }
      },
      {
        $project: {
          _id: '$result._id',
          conversationId: '$result.conversationId',
          receiverId: '$result.receiverId',
          receiverUsername: '$result.receiverUsername',
          receiverAvatarColor: '$result.receiverAvatarColor',
          receiverProfilePicture: '$result.receiverProfilePicture',
          senderUsername: '$result.senderUsername',
          senderId: '$result.senderId',
          senderAvatarColor: '$result.senderAvatarColor',
          senderProfilePicture: '$result.senderProfilePicture',
          body: '$result.body',
          isRead: '$result.isRead',
          gifUrl: '$result.gifUrl',
          selectedImage: '$result.selectedImage',
          reaction: '$result.reaction',
          createdAt: '$result.createdAt'
        }
      },
      { $sort: { createdAt: 1 } }
    ]);
    return lastMessageList;
  }

  public async getMessageListFromDB(senderId: ObjectId, receiverId: ObjectId, sort: Record<string, 1 | -1>): Promise<IMessageData[]> {
    const query = {
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId }
      ]
    };

    const messageListL: IMessageData[] = await MessageModel.aggregate([{ $match: query }, { $sort: sort }]);

    return messageListL;
  }

  public async markMessageAsDeletedInDB(messageId: string, type: string): Promise<void> {
    if (type === 'deleteForMe') {
      await MessageModel.updateOne({ _id: messageId }, { $set: { deleteForMe: true } }).exec();
    } else {
      await MessageModel.updateOne({ _id: messageId }, { $set: { deleteForMe: true, deleteForEveryone: true } }).exec();
    }
  }

  public async markMessageAsReadInDB(senderId: ObjectId, receiverId: ObjectId): Promise<void> {
    const query = {
      $or: [
        { senderId, receiverId, isRead: false },
        { senderId: receiverId, receiverId: senderId, isRead: false }
      ]
    };

    await MessageModel.updateOne(query, { $set: { isRead: true } }).exec();
  }

  public async updateMsgReactionInDB(messageId: ObjectId, reaction: string, senderName: string, type: 'add' | 'remove'): Promise<void> {
    await MessageModel.updateOne({ _id: messageId }, { $pull: { reaction: { senderName } } }).exec();
    if (type === 'add') {
      await MessageModel.updateOne({ _id: messageId }, { $push: { reaction: { senderName, type: reaction } } }).exec();
    }
  }
}

export const chatService: ChatService = new ChatService();
