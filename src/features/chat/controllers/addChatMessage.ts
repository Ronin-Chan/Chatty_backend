import { UserCache } from '@service/redis/user.cache';
import { IUserDocument } from '@user/interfaces/user.interface';
import { Request, Response, NextFunction } from 'express';
import { ObjectId } from 'mongodb';
import mongoose from 'mongoose';
import HTTP_STATUS from 'http-status-codes';
import { IChatUsers, IMessageData, IMessageNotification } from '../interfaces/chat.interface';
import { uploads } from '@global/helpers/cloudinaryUpload';
import { UploadApiResponse } from 'cloudinary';
import { BadRequestError } from '@global/helpers/errorHandler';
import { chatSocketIOObject } from '@socket/chat.socket';
import { INotificationTemplate } from '@notification/interfaces/notification.interface';
import { notificationTemplate } from '@service/emails/templates/notifications/notification-template';
import { emailQueue } from '@service/queues/email.queue';
import { ChatCache } from '@service/redis/chat.cache';
import { joiValidation } from '@global/decorators/joiValidation.decorators';
import { addChatSchema } from '@chat/schemes/chat.schemes';
import { chatQueue } from '@service/queues/chat.queue';

const userCache: UserCache = new UserCache();
const chatCache: ChatCache = new ChatCache();

export class AddChatMessage {
  @joiValidation(addChatSchema)
  public async addChatMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    const {
      conversationId,
      receiverId,
      receiverUsername,
      receiverAvatarColor,
      receiverProfilePicture,
      body, //message content
      gifUrl,
      isRead,
      selectedImage
    } = req.body;

    const messageObjectId: ObjectId = new ObjectId();
    const conversationObjectId: ObjectId = !conversationId ? new ObjectId() : conversationId;

    const sender: IUserDocument = (await userCache.getUserFromCache(`${req.currentUser?.userId}`)) as IUserDocument;

    let fileUrl = '';
    if (selectedImage.length) {
      const result: UploadApiResponse = (await uploads(selectedImage)) as UploadApiResponse;
      if (!result.public_id) {
        return next(new BadRequestError(result.message));
      }
      fileUrl = `https://res.cloudinary.com/dlohvpcwg/image/upload/v${result.version}/${result.public_id}`;
    }

    const messageData: IMessageData = {
      _id: `${messageObjectId}`,
      conversationId: new mongoose.Types.ObjectId(conversationObjectId),
      senderId: `${req.currentUser?.userId}`,
      senderUsername: `${req.currentUser?.username}`,
      senderAvatarColor: `${req.currentUser?.avatarColor}`,
      senderProfilePicture: `${sender.profilePicture}`,
      receiverId,
      receiverUsername,
      receiverAvatarColor,
      receiverProfilePicture,
      body,
      gifUrl,
      isRead,
      selectedImage: fileUrl,
      reaction: [],
      createdAt: new Date(),
      deleteForEveryone: false,
      deleteForMe: false
    };

    AddChatMessage.prototype.emitSocketIOEvent(messageData);

    if (!isRead) {
      AddChatMessage.prototype.messageNotification({
        currentUser: req.currentUser!,
        receiverId,
        receiverName: receiverUsername,
        message: body,
        messageData
      });
    }

    await chatCache.addChatListToCache(`${req.currentUser?.userId}`, receiverId, `${conversationObjectId}`);
    await chatCache.addChatListToCache(receiverId, `${req.currentUser?.userId}`, `${conversationObjectId}`);
    await chatCache.addChatMessageToCache(`${conversationObjectId}`, messageData);

    chatQueue.addChatJob('addChatMessageToDB', messageData);

    res.status(HTTP_STATUS.OK).json({ message: 'Message added', conversationId: conversationObjectId });
  }

  public async addChatUser(req: Request, res: Response): Promise<void> {
    const chatUserList: IChatUsers[] = await chatCache.addChatUserToCache(req.body);
    chatSocketIOObject.emit('add chat user', chatUserList);
    res.status(HTTP_STATUS.OK).json({ message: 'User added' });
  }

  public async removeChatUser(req: Request, res: Response): Promise<void> {
    const chatUserList: IChatUsers[] = await chatCache.removeChatUserFromCache(req.body);
    chatSocketIOObject.emit('remove chat user', chatUserList);
    res.status(HTTP_STATUS.OK).json({ message: 'User removed' });
  }

  private emitSocketIOEvent(data: IMessageData): void {
    chatSocketIOObject.emit('message received', data);
    chatSocketIOObject.emit('chat list', data);
  }

  private async messageNotification({ currentUser, receiverId, receiverName, message }: IMessageNotification): Promise<void> {
    const cachedReceiver: IUserDocument = (await userCache.getUserFromCache(receiverId)) as IUserDocument;
    if (cachedReceiver.notifications.messages) {
      const templateParams: INotificationTemplate = {
        username: receiverName,
        message,
        header: `Message notification from ${currentUser.username}`
      };
      const template: string = notificationTemplate.notificationMessageTemplate(templateParams);
      emailQueue.addEmailJob('directMessageEmail', {
        receiverEmail: cachedReceiver.email!,
        template,
        subject: `You've received messages from ${currentUser.username}`
      });
    }
  }
}
