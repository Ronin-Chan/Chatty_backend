import { IGetPostsQuery, IPostDocument, IQueryComplete, IQueryDeleted } from '@post/interfaces/post.interface';
import { PostModel } from '@post/models/post.schema';
import { IUserDocument } from '@user/interfaces/user.interface';
import { UserModel } from '@user/models/user.schema';
import { Query, UpdateQuery } from 'mongoose';

class PostService {
  public async createPost(userId: string, createdPost: IPostDocument): Promise<void> {
    const post: Promise<IPostDocument> = PostModel.create(createdPost);
    const user: UpdateQuery<IUserDocument> = UserModel.updateOne({ _id: userId }, { $inc: { postsCount: 1 } });
    await Promise.all([post, user]);
  }

  public async getPosts(query: IGetPostsQuery, skip: number, limit: number, sort: Record<string, 1 | -1>): Promise<IPostDocument[]> {
    let postQuery = {};
    if (query?.gifUrl && query?.imgId) {
      postQuery = { $or: [{ gifUrl: { $ne: '' } }, { imgId: { $ne: '' } }] };
    } else {
      postQuery = query;
    }

    const posts: IPostDocument[] = await PostModel.aggregate([
      { $match: postQuery },
      { $sort: sort },
      { $skip: skip }, // for pagination
      { $limit: limit } // for pagination
    ]);
    return posts;
  }

  public async postsCount(): Promise<number> {
    const count: number = await PostModel.find({}).countDocuments(); //find all and then count
    return count;
  }

  public async deletePost(postId: string, userId: string): Promise<void> {
    const deletePost: Query<IQueryComplete & IQueryDeleted, IPostDocument> = PostModel.deleteOne({ _id: postId });
    // delete reactions here
    const decrementPostCount: UpdateQuery<IUserDocument> = UserModel.updateOne({ _id: userId }, { $inc: { postsCount: -1 } });
    await Promise.all([deletePost, decrementPostCount]);
  }

  public async updatePost(postId: string, updatedPost: IPostDocument): Promise<void> {
    console.log(updatedPost);
    const updatePost: UpdateQuery<IPostDocument> = PostModel.updateOne({ _id: postId }, { $set: updatedPost });
    await Promise.all([updatePost]);
  }
}

export const postService: PostService = new PostService();
