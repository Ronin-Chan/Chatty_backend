import { AddComment } from '@comment/controllers/addComment';
import { GetComment } from '@comment/controllers/getComment';
import { authMiddleware } from '@global/helpers/authMiddleware';
import express, { Router } from 'express';

class CommentRoutes {
  private router: Router;

  constructor() {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.get('/post/comments/:postId', authMiddleware.checkAuthentication, GetComment.prototype.getComments);
    this.router.get('/post/commentsnames/:postId', authMiddleware.checkAuthentication, GetComment.prototype.getCommentsNamesFromCache);
    this.router.get('/post/single/comment/:postId/:commentId', authMiddleware.checkAuthentication, GetComment.prototype.getSingleComment);

    this.router.post('/post/comment', authMiddleware.checkAuthentication, AddComment.prototype.addComment);

    return this.router;
  }
}

export const commentRoutes: CommentRoutes = new CommentRoutes();
