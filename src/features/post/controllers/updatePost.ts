import { joiValidation } from '@global/decorators/joiValidation.decorators';
import { uploadVideo, uploads } from '@global/helpers/cloudinaryUpload';
import { BadRequestError } from '@global/helpers/errorHandler';
import { IPostDocument } from '@post/interfaces/post.interface';
import { postSchema, postWithImageSchema, postWithVideoSchema } from '@post/schemes/post.schemes';
import { imageQueue } from '@service/queues/image.queue';
import { postQueue } from '@service/queues/post.queue';
import { PostCache } from '@service/redis/post.cache';
import { postSocketIOObject } from '@socket/post.socket';
import { UploadApiResponse } from 'cloudinary';
import { NextFunction, Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

const postCache: PostCache = new PostCache();

export class UpdatePost {
  @joiValidation(postSchema)
  public async updatePost(req: Request, res: Response): Promise<void> {
    const { post, bgColor, feelings, privacy, gifUrl, imgVersion, imgId, profilePicture, videoId, videoVersion } = req.body;
    const { postId } = req.params;
    const updatedPost: IPostDocument = {
      post,
      bgColor,
      feelings,
      privacy,
      gifUrl,
      imgVersion,
      imgId,
      profilePicture,
      videoId,
      videoVersion
    } as IPostDocument;
    const updatedPostData: IPostDocument = await postCache.updatePostInCache(postId, updatedPost);
    postSocketIOObject.emit('update post', updatedPostData, 'posts');
    postQueue.addPostJob('updatePostInDB', { key: postId, value: updatedPostData });
    res.status(HTTP_STATUS.OK).json({ message: 'Post updated successfully' });
  }

  @joiValidation(postWithImageSchema)
  public async updatePostWithImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { imgVersion, imgId } = req.body;
    if (imgId && imgVersion) { //user doesn't change the img
      UpdatePost.prototype.updatePostFn(req);
    } else {
      const result: UploadApiResponse = await UpdatePost.prototype.updatePostWithImgOrVideoFn(req);
      if (!result?.public_id) {
        return next(new BadRequestError(result.message));
      }
    }

    res.status(HTTP_STATUS.OK).json({ message: 'Post with image updated successfully' });
  }

  @joiValidation(postWithVideoSchema)
  public async updatePostWithVideo(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { videoVersion, videoId } = req.body;
    if (videoId && videoVersion) { //means user doesn't change the video
      UpdatePost.prototype.updatePostFn(req);
    } else {
      const result: UploadApiResponse = await UpdatePost.prototype.updatePostWithImgOrVideoFn(req);
      if (!result?.public_id) {
        return next(new BadRequestError(result.message));
      }
    }

    res.status(HTTP_STATUS.OK).json({ message: 'Post with image updated successfully' });
  }

  //if client sends imgId and idVersion, it means user doesn't change the img or video
  private async updatePostFn(req: Request): Promise<void> {
    const { post, bgColor, feelings, privacy, gifUrl, imgVersion, imgId, profilePicture, videoId, videoVersion } = req.body;
    const { postId } = req.params;
    const updatedPost: IPostDocument = {
      post,
      bgColor,
      feelings,
      privacy,
      gifUrl,
      profilePicture,
      imgId: imgId ? imgId : '',
      imgVersion: imgVersion ? imgVersion : '',
      videoId: videoId ? videoId : '',
      videoVersion: videoVersion ? videoVersion : ''
    } as IPostDocument;
    const updatedPostData: IPostDocument = await postCache.updatePostInCache(postId, updatedPost);
    postSocketIOObject.emit('update post', updatedPostData, 'posts');
    postQueue.addPostJob('updatePostInDB', { key: postId, value: updatedPostData });
  }

  private async updatePostWithImgOrVideoFn(req: Request): Promise<UploadApiResponse> {
    const { post, bgColor, feelings, privacy, gifUrl, profilePicture, image, video } = req.body;
    const { postId } = req.params;
    const result: UploadApiResponse = image
      ? ((await uploads(image)) as UploadApiResponse)
      : ((await uploadVideo(video)) as UploadApiResponse);
    if (!result?.public_id) {
      return result;
    }
    const updatedPost: IPostDocument = {
      post,
      bgColor,
      feelings,
      privacy,
      gifUrl,
      profilePicture,
      imgId: image ? result.public_id : '',
      imgVersion: image ? result.version.toString() : '',
      videoId: video ? result.public_id : '',
      videoVersion: video ? result.version.toString() : ''

    } as IPostDocument;
    const updatedPostData: IPostDocument = await postCache.updatePostInCache(postId, updatedPost);
    postSocketIOObject.emit('update post', updatedPostData, 'posts');
    postQueue.addPostJob('updatePostInDB', { key: postId, value: updatedPostData });
    if (image) {
      imageQueue.addImageJob('addImageToDB', {
        key: `${req.currentUser!.userId}`,
        imgId: result.public_id,
        imgVersion: result.version.toString()
      });
    }

    return result;
  }
}
