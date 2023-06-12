/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import { Server } from 'socket.io';
import { authUserPayload } from '@root/mocks/auth.mock';
import * as postServer from '@socket/post.socket';
import { newPost, postMockRequest, postMockResponse, nextFn } from '@root/mocks/post.mock';
import { postQueue } from '@service/queues/post.queue';
import { CreatePost } from '@post/controllers/createPost';
import { PostCache } from '@service/redis/post.cache';
import { CustomError } from '@global/helpers/errorHandler';
import * as cloudinaryUploads from '@global/helpers/cloudinaryUpload';

jest.useFakeTimers();
jest.mock('@service/queues/base.queue');
jest.mock('@service/redis/post.cache');
jest.mock('@global/helpers/cloudinaryUpload');

Object.defineProperties(postServer, {
  postSocketIOObject: {
    value: new Server(),
    writable: true
  }
});

describe('CreatePost', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  describe('create', () => {
    it('should send correct json response', async () => {
      const req: Request = postMockRequest(newPost, authUserPayload) as Request;
      const res: Response = postMockResponse();
      jest.spyOn(postServer.postSocketIOObject, 'emit');
      const spy = jest.spyOn(PostCache.prototype, 'savePostToCache');
      jest.spyOn(postQueue, 'addPostJob');

      await CreatePost.prototype.create(req, res);
      const createdPost = spy.mock.calls[0][0].createdPost;
      expect(postServer.postSocketIOObject.emit).toHaveBeenCalledWith('add post', createdPost);
      expect(PostCache.prototype.savePostToCache).toHaveBeenCalledWith({
        key: spy.mock.calls[0][0].key,
        currentUserId: `${req.currentUser?.userId}`,
        uId: `${req.currentUser?.uId}`,
        createdPost
      });
      expect(postQueue.addPostJob).toHaveBeenCalledWith('addPostToDB', { key: req.currentUser?.userId, value: createdPost });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Post created successfully'
      });
    });
  });

  describe('createWithImage', () => {
    //to test whether postWithImageSchema is effective
    it('should throw an error if image is not available', () => {
      delete newPost.image;
      const req: Request = postMockRequest(newPost, authUserPayload) as Request;
      const res: Response = postMockResponse();
      CreatePost.prototype.createWithImage(req, res, nextFn).catch((error: CustomError) => {
        expect(error.statusCode).toEqual(400);
        expect(error.serializeErrors().message).toEqual('Image is a required field');
      });
    });
    it('should throw an upload error', () => {
      newPost.image = 'data:text/plain;base64,SGVsbG8sIFdvcmxkIQ==';
      const req: Request = postMockRequest(newPost, authUserPayload) as Request;
      const res: Response = postMockResponse();
      jest
        .spyOn(cloudinaryUploads, 'uploads')
        .mockImplementation((): any => Promise.resolve({ version: '', public_id: '', message: 'Upload error' }));
      CreatePost.prototype.createWithImage(req, res, nextFn).catch((error: CustomError) => {
        expect(error.statusCode).toEqual(400);
        expect(error.serializeErrors().message).toEqual('Upload error');
      });
    });
    it('should send correct json response', async () => {
      newPost.image = 'testing image';
      const req: Request = postMockRequest(newPost, authUserPayload) as Request;
      const res: Response = postMockResponse();
      jest.spyOn(postServer.postSocketIOObject, 'emit');
      const spy = jest.spyOn(PostCache.prototype, 'savePostToCache');
      jest.spyOn(postQueue, 'addPostJob');
      jest.spyOn(cloudinaryUploads, 'uploads').mockImplementation((): any => Promise.resolve({ version: '1234', public_id: '123456' }));
      await CreatePost.prototype.createWithImage(req, res, nextFn);
      const createdPost = spy.mock.calls[0][0].createdPost;
      expect(postServer.postSocketIOObject.emit).toHaveBeenCalledWith('add post', createdPost);
      expect(PostCache.prototype.savePostToCache).toHaveBeenCalledWith({
        key: spy.mock.calls[0][0].key,
        currentUserId: `${req.currentUser?.userId}`,
        uId: `${req.currentUser?.uId}`,
        createdPost
      });
      expect(postQueue.addPostJob).toHaveBeenCalledWith('addPostToDB', { key: req.currentUser?.userId, value: createdPost });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Post created with image successfully'
      });
    });
  });
});
