import { Request, Response } from 'express';
import { Server } from 'socket.io';
import { authUserPayload } from '@root/mocks/auth.mock';
import * as postServer from '@socket/post.socket';
import { newPost, postMockRequest, postMockResponse } from '@root/mocks/post.mock';
import { postQueue } from '@service/queues/post.queue';
import { DeletePost } from '@post/controllers/deletePost';
import { PostCache } from '@service/redis/post.cache';

jest.useFakeTimers();
jest.mock('@service/queues/base.queue');
jest.mock('@service/redis/post.cache');

Object.defineProperties(postServer, {
  postSocketIOObject: {
    value: new Server(),
    writable: true
  }
});

describe('DeletePost', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  it('should send correct json response', async () => {
    const req: Request = postMockRequest(newPost, authUserPayload, { postId: '12345' }) as Request;
    const res: Response = postMockResponse();
    jest.spyOn(postServer.postSocketIOObject, 'emit');
    jest.spyOn(PostCache.prototype, 'deletePostFromCache');
    jest.spyOn(postQueue, 'addPostJob');

    await DeletePost.prototype.deletePost(req, res);
    expect(postServer.postSocketIOObject.emit).toHaveBeenCalledWith('delete post', req.params.postId);
    expect(PostCache.prototype.deletePostFromCache).toHaveBeenCalledWith(req.params.postId, `${req.currentUser?.userId}`);
    expect(postQueue.addPostJob).toHaveBeenCalledWith('deletePostFromDB', { keyOne: req.params.postId, keyTwo: req.currentUser?.userId });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Post deleted successfully'
    });
  });
});
