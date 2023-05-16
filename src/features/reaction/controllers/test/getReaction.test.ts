import { Request, Response } from 'express';
import { authUserPayload } from '@root/mocks/auth.mock';
import { reactionMockRequest, reactionMockResponse, reactionData } from '@root/mocks/reactions.mock';
import { reactionService } from '@service/db/reaction.service';
import { ReactionCache } from '@service/redis/reaction.cache';
import { GetReaction } from '@reaction/controllers/getReaction';
import { postMockData } from '@root/mocks/post.mock';
import mongoose from 'mongoose';

jest.useFakeTimers();
jest.mock('@service/queues/base.queue');
jest.mock('@service/redis/reaction.cache');

describe('GetReaction', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  describe('getReactions', () => {
    it('should send correct json response if reactions exist in cache', async () => {
      const req: Request = reactionMockRequest({}, {}, authUserPayload, {
        postId: `${postMockData._id}`
      }) as Request;
      const res: Response = reactionMockResponse();
      jest.spyOn(ReactionCache.prototype, 'getPostReactionsFromCache').mockResolvedValue([[reactionData], 1]);

      await GetReaction.prototype.getReactions(req, res);
      expect(ReactionCache.prototype.getPostReactionsFromCache).toHaveBeenCalledWith(`${postMockData._id}`);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Post reactions',
        reactions: [reactionData],
        count: 1
      });
    });

    it('should send correct json response if reactions exist in database', async () => {
      const req: Request = reactionMockRequest({}, {}, authUserPayload, {
        postId: `${postMockData._id}`
      }) as Request;
      const res: Response = reactionMockResponse();
      jest.spyOn(ReactionCache.prototype, 'getPostReactionsFromCache').mockResolvedValue([[], 0]);
      jest.spyOn(reactionService, 'getPostReactions').mockResolvedValue([[reactionData], 1]);

      await GetReaction.prototype.getReactions(req, res);
      expect(reactionService.getPostReactions).toHaveBeenCalledWith(
        { postId: new mongoose.Types.ObjectId(`${postMockData._id}`) },
        { createdAt: -1 }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Post reactions',
        reactions: [reactionData],
        count: 1
      });
    });

    it('should send correct json response if reactions list is empty', async () => {
      const req: Request = reactionMockRequest({}, {}, authUserPayload, {
        postId: `${postMockData._id}`
      }) as Request;
      const res: Response = reactionMockResponse();
      jest.spyOn(ReactionCache.prototype, 'getPostReactionsFromCache').mockResolvedValue([[], 0]);
      jest.spyOn(reactionService, 'getPostReactions').mockResolvedValue([[], 0]);

      await GetReaction.prototype.getReactions(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Post reactions',
        reactions: [],
        count: 0
      });
    });
  });

  describe('getSingleReactionByUsername', () => {
    it('should send correct json response if reactions exist in cache', async () => {
      const req: Request = reactionMockRequest({}, {}, authUserPayload, {
        postId: `${postMockData._id}`,
        username: postMockData.username
      }) as Request;
      const res: Response = reactionMockResponse();
      jest.spyOn(ReactionCache.prototype, 'getSinglePostReactionByUsernameFromCache').mockResolvedValue([reactionData, 1]);

      await GetReaction.prototype.getSingleReactionByUsername(req, res);
      expect(ReactionCache.prototype.getSinglePostReactionByUsernameFromCache).toHaveBeenCalledWith(
        `${postMockData._id}`,
        postMockData.username
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Single post reaction by username',
        reactions: reactionData,
        count: 1
      });
    });

    it('should send correct json response if reactions exist in database', async () => {
      const req: Request = reactionMockRequest({}, {}, authUserPayload, {
        postId: `${postMockData._id}`,
        username: postMockData.username
      }) as Request;
      const res: Response = reactionMockResponse();
      jest.spyOn(ReactionCache.prototype, 'getSinglePostReactionByUsernameFromCache').mockResolvedValue([]);
      jest.spyOn(reactionService, 'getSinglePostReactionByUsername').mockResolvedValue([reactionData, 1]);

      await GetReaction.prototype.getSingleReactionByUsername(req, res);
      expect(reactionService.getSinglePostReactionByUsername).toHaveBeenCalledWith(`${postMockData._id}`, postMockData.username);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Single post reaction by username',
        reactions: reactionData,
        count: 1
      });
    });

    it('should send correct json response if reactions list is empty', async () => {
      const req: Request = reactionMockRequest({}, {}, authUserPayload, {
        postId: `${postMockData._id}`,
        username: postMockData.username
      }) as Request;
      const res: Response = reactionMockResponse();
      jest.spyOn(ReactionCache.prototype, 'getSinglePostReactionByUsernameFromCache').mockResolvedValue([]);
      jest.spyOn(reactionService, 'getSinglePostReactionByUsername').mockResolvedValue([]);

      await GetReaction.prototype.getSingleReactionByUsername(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Single post reaction by username',
        reactions: {},
        count: 0
      });
    });
  });

  describe('getReactionsByUsername', () => {
    it('should send correct json response if reactions exist in database', async () => {
      const req: Request = reactionMockRequest({}, {}, authUserPayload, {
        username: postMockData.username
      }) as Request;
      const res: Response = reactionMockResponse();
      jest.spyOn(reactionService, 'getReactionsByUsername').mockResolvedValue([reactionData]);

      await GetReaction.prototype.getReactionsByUsername(req, res);
      expect(reactionService.getReactionsByUsername).toHaveBeenCalledWith(postMockData.username);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'All user reactions by username',
        reactions: [reactionData]
      });
    });

    it('should send correct json response if reactions list is empty', async () => {
      const req: Request = reactionMockRequest({}, {}, authUserPayload, {
        username: postMockData.username
      }) as Request;
      const res: Response = reactionMockResponse();
      jest.spyOn(reactionService, 'getReactionsByUsername').mockResolvedValue([]);

      await GetReaction.prototype.getReactionsByUsername(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'All user reactions by username',
        reactions: []
      });
    });
  });
});
