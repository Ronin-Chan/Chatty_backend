import mongoose from 'mongoose';
import { Request, Response } from 'express';
import { authUserPayload } from '@root/mocks/auth.mock';
import { commentNames, commentsData, commentMockRequest, commentMockResponse } from '@root/mocks/comment.mock';
import { CommentCache } from '@service/redis/comment.cache';
import { GetComment } from '@comment/controllers/getComment';
import { commentService } from '@service/db/comment.service';

jest.useFakeTimers();
jest.mock('@service/queues/base.queue');
jest.mock('@service/redis/comment.cache');

describe('GetComment', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  describe('getComments', () => {
    it('should send correct json response if comments exist in cache', async () => {
      const req: Request = commentMockRequest({}, {}, authUserPayload, {
        postId: '645b4c0fff825ced1b3f4345'
      }) as Request;
      const res: Response = commentMockResponse();
      jest.spyOn(CommentCache.prototype, 'getCommentsFromCache').mockResolvedValue([commentsData]);

      await GetComment.prototype.getComments(req, res);
      expect(CommentCache.prototype.getCommentsFromCache).toHaveBeenCalledWith('645b4c0fff825ced1b3f4345');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Post comments',
        comments: [commentsData]
      });
    });

    it('should send correct json response if comments exist in database', async () => {
      const req: Request = commentMockRequest({}, {}, authUserPayload, {
        postId: '645b4c0fff825ced1b3f4345'
      }) as Request;
      const res: Response = commentMockResponse();
      jest.spyOn(CommentCache.prototype, 'getCommentsFromCache').mockResolvedValue([]);
      jest.spyOn(commentService, 'getCommentsFromDB').mockResolvedValue([commentsData]);

      await GetComment.prototype.getComments(req, res);
      expect(commentService.getCommentsFromDB).toHaveBeenCalledWith(
        { postId: new mongoose.Types.ObjectId('645b4c0fff825ced1b3f4345') },
        { createdAt: -1 }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Post comments',
        comments: [commentsData]
      });
    });
  });

  describe('getCommentsNamesFromCache', () => {
    it('should send correct json response if data exist in redis', async () => {
      const req: Request = commentMockRequest({}, {}, authUserPayload, {
        postId: '645b4c0fff825ced1b3f4345'
      }) as Request;
      const res: Response = commentMockResponse();
      jest.spyOn(CommentCache.prototype, 'getCommentsNamesFromCache').mockResolvedValue([commentNames]);

      await GetComment.prototype.getCommentsNamesFromCache(req, res);
      expect(CommentCache.prototype.getCommentsNamesFromCache).toHaveBeenCalledWith('645b4c0fff825ced1b3f4345');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Post comments names',
        comments: commentNames
      });
    });

    it('should send correct json response if data exist in database', async () => {
      const req: Request = commentMockRequest({}, {}, authUserPayload, {
        postId: '645b4c0fff825ced1b3f4345'
      }) as Request;
      const res: Response = commentMockResponse();
      jest.spyOn(CommentCache.prototype, 'getCommentsNamesFromCache').mockResolvedValue([]);
      jest.spyOn(commentService, 'getCommentsNamesFromDB').mockResolvedValue([commentNames]);

      await GetComment.prototype.getCommentsNamesFromCache(req, res);
      expect(commentService.getCommentsNamesFromDB).toHaveBeenCalledWith(
        { postId: new mongoose.Types.ObjectId('645b4c0fff825ced1b3f4345') },
        { createdAt: -1 }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Post comments names',
        comments: commentNames
      });
    });

    it('should return empty comments if data does not exist in redis and database', async () => {
      const req: Request = commentMockRequest({}, {}, authUserPayload, {
        postId: '645b4c0fff825ced1b3f4345'
      }) as Request;
      const res: Response = commentMockResponse();
      jest.spyOn(CommentCache.prototype, 'getCommentsNamesFromCache').mockResolvedValue([]);
      jest.spyOn(commentService, 'getCommentsNamesFromDB').mockResolvedValue([]);

      await GetComment.prototype.getCommentsNamesFromCache(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Post comments names',
        comments: []
      });
    });
  });

  describe('getSingleComment', () => {
    it('should send correct json response from cache', async () => {
      const req: Request = commentMockRequest({}, {}, authUserPayload, {
        commentId: '6464ef73c51f9645e3986cb0',
        postId: '645b4c0fff825ced1b3f4345'
      }) as Request;
      const res: Response = commentMockResponse();
      jest.spyOn(CommentCache.prototype, 'getSingleCommentFromCache').mockResolvedValue([commentsData]);

      await GetComment.prototype.getSingleComment(req, res);
      expect(CommentCache.prototype.getSingleCommentFromCache).toHaveBeenCalledWith('645b4c0fff825ced1b3f4345', '6064861bc25eaa5a5d2f9bf4');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Single comment',
        comments: commentsData
      });
    });

    it('should send correct json response from database', async () => {
      const req: Request = commentMockRequest({}, {}, authUserPayload, {
        commentId: '6064861bc25eaa5a5d2f9bf4',
        postId: '645b4c0fff825ced1b3f4345'
      }) as Request;
      const res: Response = commentMockResponse();
      jest.spyOn(CommentCache.prototype, 'getSingleCommentFromCache').mockResolvedValue([]);
      jest.spyOn(commentService, 'getCommentsFromDB').mockResolvedValue([commentsData]);

      await GetComment.prototype.getSingleComment(req, res);
      expect(commentService.getCommentsFromDB).toHaveBeenCalledWith(
        { _id: new mongoose.Types.ObjectId('6064861bc25eaa5a5d2f9bf4') },
        { createdAt: -1 }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Single comment',
        comments: commentsData
      });
    });
  });
});
