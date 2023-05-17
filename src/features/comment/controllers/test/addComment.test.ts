import { Request, Response } from 'express';
import { authUserPayload } from '@root/mocks/auth.mock';
import { reactionMockRequest, reactionMockResponse } from '@root/mocks/reaction.mock';
import { CommentCache } from '@service/redis/comment.cache';
import { commentQueue } from '@service/queues/comment.queue';
import { AddComment } from '@comment/controllers/addComment';
import { existingUser } from '@root/mocks/user.mock';

jest.useFakeTimers();
jest.mock('@service/queues/base.queue');
jest.mock('@service/redis/comment.cache');

describe('AddComment', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  it('should call savePostCommentToCache and addCommentJob methods', async () => {
    const req: Request = reactionMockRequest(
      {},
      {
        postId: '645b4c0fff825ced1b3f4345',
        comment: 'This is a comment',
        profilePicture: 'https://place-hold.it/500x500',
        userTo: `${existingUser._id}`
      },
      authUserPayload
    ) as Request;
    const res: Response = reactionMockResponse();
    jest.spyOn(CommentCache.prototype, 'savePostCommentToCache');
    jest.spyOn(commentQueue, 'addCommentJob');

    await AddComment.prototype.addComment(req, res);
    expect(CommentCache.prototype.savePostCommentToCache).toHaveBeenCalled();
    expect(commentQueue.addCommentJob).toHaveBeenCalled();
  });

  it('should send correct json response', async () => {
    const req: Request = reactionMockRequest(
      {},
      {
        postId: '645b4c0fff825ced1b3f4345',
        comment: 'This is a comment',
        profilePicture: 'https://place-hold.it/500x500',
        userTo: `${existingUser._id}`
      },
      authUserPayload
    ) as Request;
    const res: Response = reactionMockResponse();

    await AddComment.prototype.addComment(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Comment created successfully'
    });
  });
});
