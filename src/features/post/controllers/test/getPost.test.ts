import { Request, Response } from 'express';
import { authUserPayload } from '@root/mocks/auth.mock';
import { newPost, postMockData, postMockRequest, postMockResponse } from '@root/mocks/post.mock';
import { PostCache } from '@service/redis/post.cache';
import { GetPost } from '@post/controllers/getPost';
import { postService } from '@service/db/post.service';

jest.useFakeTimers();
jest.mock('@service/queues/base.queue');
jest.mock('@service/redis/post.cache');

describe('GetPost', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  describe('posts', () => {
    it('should send correct json response if posts exist in cache', async () => {
      const req: Request = postMockRequest(newPost, authUserPayload, { page: '1' }) as Request;
      const res: Response = postMockResponse();
      jest.spyOn(PostCache.prototype, 'getPostsFromCache').mockResolvedValue([postMockData]);
      jest.spyOn(PostCache.prototype, 'getTotalPostsInCache').mockResolvedValue(1);

      await GetPost.prototype.getPosts(req, res);
      expect(PostCache.prototype.getPostsFromCache).toHaveBeenCalledWith('post', 0, 10);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'All posts',
        posts: [postMockData],
        totalPosts: 1
      });
    });

    it('should send correct json response if posts exist in database', async () => {
      const req: Request = postMockRequest(newPost, authUserPayload, { page: '1' }) as Request;
      const res: Response = postMockResponse();
      jest.spyOn(PostCache.prototype, 'getPostsFromCache').mockResolvedValue([]); //to mock doesn't get data from cache
      jest.spyOn(PostCache.prototype, 'getTotalPostsInCache').mockResolvedValue(0); //to mock doesn't get data from cache
      jest.spyOn(postService, 'getPosts').mockResolvedValue([postMockData]);
      jest.spyOn(postService, 'postsCount').mockResolvedValue(1);

      await GetPost.prototype.getPosts(req, res);
      expect(postService.getPosts).toHaveBeenCalledWith({}, 0, 10, { createdAt: -1 });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'All posts',
        posts: [postMockData],
        totalPosts: 1
      });
    });

    //to mock doesn't get any data from cache and db
    it('should send empty posts', async () => {
      const req: Request = postMockRequest(newPost, authUserPayload, { page: '1' }) as Request;
      const res: Response = postMockResponse();
      jest.spyOn(PostCache.prototype, 'getPostsFromCache').mockResolvedValue([]);
      jest.spyOn(PostCache.prototype, 'getTotalPostsInCache').mockResolvedValue(0);
      jest.spyOn(postService, 'getPosts').mockResolvedValue([]);
      jest.spyOn(postService, 'postsCount').mockResolvedValue(0);

      await GetPost.prototype.getPosts(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'All posts',
        posts: [],
        totalPosts: 0
      });
    });
  });

  describe('getPostsWithImages', () => {
    it('should send correct json response if posts exist in cache', async () => {
      const req: Request = postMockRequest(newPost, authUserPayload, { page: '1' }) as Request;
      const res: Response = postMockResponse();
      jest.spyOn(PostCache.prototype, 'getPostsWithImagesFromCache').mockResolvedValue([postMockData]);

      await GetPost.prototype.getPostsWithImages(req, res);
      expect(PostCache.prototype.getPostsWithImagesFromCache).toHaveBeenCalledWith('post', 0, 10);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'All posts with images',
        posts: [postMockData]
      });
    });

    it('should send correct json response if posts exist in database', async () => {
      const req: Request = postMockRequest(newPost, authUserPayload, { page: '1' }) as Request;
      const res: Response = postMockResponse();
      jest.spyOn(PostCache.prototype, 'getPostsWithImagesFromCache').mockResolvedValue([]);
      jest.spyOn(postService, 'getPosts').mockResolvedValue([postMockData]);

      await GetPost.prototype.getPostsWithImages(req, res);
      expect(postService.getPosts).toHaveBeenCalledWith({ imgId: '$ne', gifUrl: '$ne' }, 0, 10, { createdAt: -1 });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'All posts with images',
        posts: [postMockData]
      });
    });

    it('should send empty posts', async () => {
      const req: Request = postMockRequest(newPost, authUserPayload, { page: '1' }) as Request;
      const res: Response = postMockResponse();
      jest.spyOn(PostCache.prototype, 'getPostsWithImagesFromCache').mockResolvedValue([]);
      jest.spyOn(postService, 'getPosts').mockResolvedValue([]);

      await GetPost.prototype.getPostsWithImages(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'All posts with images',
        posts: []
      });
    });
  });
});
