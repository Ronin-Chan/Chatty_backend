import { joiValidation } from '@global/decorators/joiValidation.decorators';
import { uploads } from '@global/helpers/cloudinaryUpload';
import { BadRequestError } from '@global/helpers/errorHandler';
import { IPostDocument } from '@post/interfaces/post.interface';
import { postSchema, postWithImageSchema } from '@post/schemes/post.schemes';
import { postQueue } from '@service/queues/post.queue';
import { PostCache } from '@service/redis/post.cache';
import { postSocketIOObject } from '@socket/post.socket';
import { UploadApiResponse } from 'cloudinary';
import { NextFunction, Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

const postCache: PostCache = new PostCache();

export class UpdatePost{
  @joiValidation(postSchema)
  public async updatePost(req: Request, res: Response): Promise<void>{
    const { post, bgColor, feelings, privacy, gifUrl, imgVersion, imgId, profilePicture } = req.body;
    const { postId } = req.params;
    const updatedPost: IPostDocument = {
      post,
      bgColor,
      feelings,
      privacy,
      gifUrl,
      imgVersion,
      imgId,
      profilePicture
    } as IPostDocument ;
    const updatedPostData: IPostDocument = await postCache.updatePostInCache(postId, updatedPost);
    postSocketIOObject.emit('update post', updatedPostData, 'posts');
    postQueue.addPostJob('updatePostInDB', { key: postId, value: updatedPostData });
    res.status(HTTP_STATUS.OK).json({ message: 'Post updated successfully' });

  }

  @joiValidation(postWithImageSchema)
  public async updatePostWithImage(req: Request, res: Response, next: NextFunction): Promise<void>{
    const { imgVersion, imgId } = req.body;
    if(imgId && imgVersion){
      UpdatePost.prototype.updatePostFn(req);
    }else{
      const result: UploadApiResponse = await UpdatePost.prototype.updatePostWithImgFn(req);
      if (!result?.public_id) {
        return next(new BadRequestError(result.message));
      }
    }

    res.status(HTTP_STATUS.OK).json({ message: 'Post with image updated successfully' });
  }

  private async updatePostFn(req: Request): Promise<void>{
    const { post, bgColor, feelings, privacy, gifUrl, imgVersion, imgId, profilePicture } = req.body;
    const { postId } = req.params;
    const updatedPost: IPostDocument = {
      post,
      bgColor,
      feelings,
      privacy,
      gifUrl,
      imgVersion,
      imgId,
      profilePicture
    } as IPostDocument ;
    const updatedPostData: IPostDocument = await postCache.updatePostInCache(postId, updatedPost);
    postSocketIOObject.emit('update post', updatedPostData, 'posts');
    postQueue.addPostJob('updatePostInDB', { key: postId, value: updatedPostData });

  }

  private async updatePostWithImgFn(req: Request): Promise<UploadApiResponse>{
    const { post, bgColor, feelings, privacy, gifUrl, profilePicture, image } = req.body;
    const { postId } = req.params;
    const result: UploadApiResponse = (await uploads(image)) as UploadApiResponse;
    if (!result?.public_id) {
      return result;
    }
    const updatedPost: IPostDocument = {
      post,
      bgColor,
      feelings,
      privacy,
      gifUrl,
      imgVersion: result.version.toString(),
      imgId: result.public_id,
      profilePicture,
    } as IPostDocument ;
    const updatedPostData: IPostDocument = await postCache.updatePostInCache(postId, updatedPost);
    postSocketIOObject.emit('update post', updatedPostData, 'posts');
    postQueue.addPostJob('updatePostInDB', { key: postId, value: updatedPostData });

    return result;

  }


}
