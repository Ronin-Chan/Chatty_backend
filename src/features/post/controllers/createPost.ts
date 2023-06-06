import HTTP_STATUS from 'http-status-codes';
import { joiValidation } from '@global/decorators/joiValidation.decorators';
import { IPostDocument, ISavePostToCache } from '@post/interfaces/post.interface';
import { postSchema, postWithImageSchema } from '@post/schemes/post.schemes';
import { NextFunction, Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { PostCache } from '@service/redis/post.cache';
import { postSocketIOObject } from '@socket/post.socket';
import { postQueue } from '@service/queues/post.queue';
import { UploadApiResponse } from 'cloudinary';
import { BadRequestError } from '@global/helpers/errorHandler';
import { uploads } from '@global/helpers/cloudinaryUpload';
import { imageQueue } from '@service/queues/image.queue';

const postCache: PostCache = new PostCache();

export class CreatePost {
  @joiValidation(postSchema)
  public async create(req: Request, res: Response): Promise<void> {
    const { post, bgColor, feelings, gifUrl, profilePicture, privacy } = req.body;

    const postObjectId: ObjectId = new ObjectId();
    const createdPost: IPostDocument = {
      _id: postObjectId,
      userId: req.currentUser!.uId,
      username: req.currentUser!.username,
      email: req.currentUser!.email,
      avatarColor: req.currentUser!.avatarColor,
      post,
      bgColor,
      feelings,
      privacy,
      gifUrl,
      profilePicture,
      commentsCount: 0,
      reactions: {
        like: 0,
        love: 0,
        happy: 0,
        wow: 0,
        sad: 0,
        angry: 0
      },
      imgVersion: '',
      imgId: '',
      createdAt: new Date()
    } as IPostDocument;

    postSocketIOObject.emit('add post', createdPost); //user can see the post before save to cache or db

    const postData: ISavePostToCache = {
      key: postObjectId, //_id is the same as key
      currentUserId: req.currentUser!.userId,
      uId: req.currentUser!.uId, //for redis
      createdPost
    };

    await postCache.savePostToCache(postData);
    postQueue.addPostJob('addPostToDB', { key: req.currentUser!.userId, value: createdPost });

    res.status(HTTP_STATUS.CREATED).json({ message: 'Post created successfully' });
  }

  @joiValidation(postWithImageSchema)
  public async createWithImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { post, bgColor, feelings, gifUrl, profilePicture, privacy, image } = req.body;

    const result: UploadApiResponse = (await uploads(image)) as UploadApiResponse;
    if (!result?.public_id) {
      return next(new BadRequestError(result.message));
    }

    const postObjectId: ObjectId = new ObjectId();
    const createdPost: IPostDocument = {
      _id: postObjectId,
      userId: req.currentUser!.uId,
      username: req.currentUser!.username,
      email: req.currentUser!.email,
      avatarColor: req.currentUser!.avatarColor,
      post,
      bgColor,
      feelings,
      privacy,
      gifUrl,
      profilePicture,
      commentsCount: 0,
      reactions: {
        like: 0,
        love: 0,
        happy: 0,
        wow: 0,
        sad: 0,
        angry: 0
      },
      imgVersion: result.version.toString(),
      imgId: result.public_id,
      createdAt: new Date()
    } as IPostDocument;

    postSocketIOObject.emit('add post', createdPost); //user can see the post before save to cache or db

    const postData: ISavePostToCache = {
      key: postObjectId,
      currentUserId: req.currentUser!.userId,
      uId: req.currentUser!.uId, //for redis
      createdPost
    };

    await postCache.savePostToCache(postData);
    postQueue.addPostJob('addPostToDB', { key: req.currentUser!.userId, value: createdPost });
    imageQueue.addImageJob('addImageToDB', {
      userId: `${req.currentUser!.userId}`,
      imgId: result.public_id,
      imgVersion: result.version.toString()
    });

    res.status(HTTP_STATUS.CREATED).json({ message: 'Post created with image successfully' });
  }
}
