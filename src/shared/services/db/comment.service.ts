import { ICommentDocument, ICommentJob, ICommentNameList, IQueryComment } from '@comment/interfaces/comment.interface';
import { CommentsModel } from '@comment/models/comment.schema';
import { IPostDocument } from '@post/interfaces/post.interface';
import { PostModel } from '@post/models/post.schema';
import { UserCache } from '@service/redis/user.cache';
import { IUserDocument } from '@user/interfaces/user.interface';
import { Query } from 'mongoose';

const userCache: UserCache = new UserCache();

class CommentService{
  public async addCommentToDB(commentData: ICommentJob): Promise<void>{
    const { postId, userTo, userFrom, comment, username } = commentData;
    //add comment
    const comments: Promise<ICommentDocument> = CommentsModel.create(comment);
    //update commentsCount of post
    const post: Query<IPostDocument, IPostDocument> = PostModel.findOneAndUpdate(
      { _id: postId },
      { $inc: { commentsCount: 1 } },
      { new: true }
    ) as Query<IPostDocument, IPostDocument>;
    //get user from cache for notification
    const user: Promise<IUserDocument> = userCache.getUserFromCache(userTo) as Promise<IUserDocument>;
    const result: [ICommentDocument, IPostDocument, IUserDocument] = await Promise.all([comments, post, user]);
  };

  /**
   * 1.get comments of single post - postId
   * OR
   * 2.get single comment of single post - commentId
   *
   */
  public async getCommentsFromDB(query: IQueryComment, sort: Record<string, 1 | -1>): Promise<ICommentDocument[]>{
    const comments: ICommentDocument[] = await CommentsModel.aggregate([{ $match: query }, { $sort: sort }]);
    return comments;
  }

  //get all usernames of all comments of single post
  public async getCommentsNamesFromDB(query: IQueryComment, sort: Record<string, 1 | -1>): Promise<ICommentNameList[]>{
    //create two new properties: names, count
    //{ $sum: 1 } - everytime finds a new document, will increase by 1
    const result: ICommentNameList[] =  await CommentsModel.aggregate([
      { $match: query },
      { $sort: sort },
      { $group: { _id: null, names: { $addToSet: '$username' }, count: { $sum: 1 } } },
      { $project: { _id: 0 } }
    ]);

    return result;
  }

}

export const commentService: CommentService = new CommentService();
