import { Helpers } from '@global/helpers/helpers';
import { INotificationDocument, INotificationTemplate } from '@notification/interfaces/notification.interface';
import { NotificationModel } from '@notification/models/notification.schema';
import { IPostDocument } from '@post/interfaces/post.interface';
import { PostModel } from '@post/models/post.schema';
import { IQueryReaction, IReactionDocument, IReactionJob } from '@reaction/interfaces/reaction.interface';
import { ReactionModel } from '@reaction/models/reaction.schema';
import { notificationTemplate } from '@service/emails/templates/notifications/notification-template';
import { emailQueue } from '@service/queues/email.queue';
import { UserCache } from '@service/redis/user.cache';
import { notificationSocketIOObject } from '@socket/notification.socket';
import { IUserDocument } from '@user/interfaces/user.interface';
import { omit } from 'lodash';
import mongoose from 'mongoose';

const userCache: UserCache = new UserCache();

class ReactionService {
  public async addReactionToDB(reactionData: IReactionJob): Promise<void> {
    const { postId, userTo, userFrom, username, type, previousReaction, reactionObject } = reactionData;
    let updatedReactionObject: IReactionDocument = reactionObject as IReactionDocument;
    if (previousReaction) {
      updatedReactionObject = omit(reactionObject, ['_id']);
    }

    const result: [IUserDocument, IReactionDocument, IPostDocument] = (await Promise.all([
      userCache.getUserFromCache(`${userTo}`),
      ReactionModel.replaceOne(
        { postId, username, type: previousReaction }, //match
        updatedReactionObject,
        { upsert: true } //if exist, replace it. Otherwise, new one.
      ),
      PostModel.findOneAndUpdate(
        { _id: postId },
        {
          $inc: {
            [`reactions.${previousReaction}`]: -1,
            [`reactions.${type}`]: 1
          }
        },
        { new: true }
      )
    ])) as unknown as [IUserDocument, IReactionDocument, IPostDocument];

    if (result[0].notifications.reactions && userFrom !== userTo) {
      const notificationModel: INotificationDocument = new NotificationModel();
      const notifications = await notificationModel.insertNotification({
        userFrom: userFrom as string,
        userTo: userTo as string,
        message: `${username} reacted to your post.`,
        notificationType: 'reaction',
        entityId: new mongoose.Types.ObjectId(postId),
        createdItemId: new mongoose.Types.ObjectId(result[1]._id!),
        createdAt: new Date(),
        comment: '',
        post: result[2].post, //post: post content
        imgId: result[2].imgId!,
        imgVersion: result[2].imgVersion!,
        gifUrl: result[2].gifUrl!,
        reaction: type!
      });
      notificationSocketIOObject.emit('insert notification', notifications, { userTo });
      const templateParams: INotificationTemplate = {
        username: result[0].username!,
        message: `${username} reacted to your post.`,
        header: 'Reaction Notification'
      };
      const template: string = notificationTemplate.notificationMessageTemplate(templateParams);
      emailQueue.addEmailJob('reactionEmail', { receiverEmail: result[0].email!, template, subject: 'Post reaction notification' });
    }
  }

  public async removeReactionFromDB(reactionData: IReactionJob): Promise<void> {
    const { postId, previousReaction, username } = reactionData;
    await Promise.all([
      ReactionModel.deleteOne({ postId, username, type: previousReaction }),
      PostModel.updateOne(
        { _id: postId },
        {
          $inc: {
            [`reactions.${previousReaction}`]: -1
          }
        },
        { new: true }
      )
    ]);
  }

  public async getPostReactions(query: IQueryReaction, sort: Record<string, 1 | -1>): Promise<[IReactionDocument[], number]> {
    const reactions: IReactionDocument[] = await ReactionModel.aggregate([{ $match: query }, { $sort: sort }]);
    return [reactions, reactions.length]; //aggregate return a list
  }

  public async getSinglePostReactionByUsername(postId: string, username: string): Promise<[IReactionDocument, number] | []> {
    const reactions: IReactionDocument[] = await ReactionModel.aggregate([
      { $match: { postId: new mongoose.Types.ObjectId(postId), username: Helpers.firstLetterUppercase(username) } }
    ]);
    return reactions.length ? [reactions[0], 1] : [];
  }

  public async getReactionsByUsername(username: string): Promise<IReactionDocument[]> {
    const reactions: IReactionDocument[] = await ReactionModel.aggregate([
      { $match: { username: Helpers.firstLetterUppercase(username) } }
    ]);
    return reactions;
  }
}

export const reactionService: ReactionService = new ReactionService();
