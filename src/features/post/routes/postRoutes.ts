import { authMiddleware } from '@global/helpers/authMiddleware';
import { CreatePost } from '@post/controllers/createPost';
import { DeletePost } from '@post/controllers/deletePost';
import { GetPost } from '@post/controllers/getPost';
import { UpdatePost } from '@post/controllers/updatePost';
import express, { Router } from 'express';

class PostRoutes {
  private router: Router;

  constructor() {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.get('/post/all/:page', authMiddleware.checkAuthentication, GetPost.prototype.getPosts);
    this.router.get('/post/images/:page', authMiddleware.checkAuthentication, GetPost.prototype.getPostsWithImages);

    this.router.post('/post', authMiddleware.checkAuthentication, CreatePost.prototype.create);
    this.router.post('/post/image/post', authMiddleware.checkAuthentication, CreatePost.prototype.createWithImage);

    this.router.put('/post/:postId', authMiddleware.checkAuthentication, UpdatePost.prototype.updatePost);
    this.router.put('/post/image/:postId', authMiddleware.checkAuthentication, UpdatePost.prototype.updatePostWithImage);

    this.router.delete('/post/:postId', authMiddleware.checkAuthentication, DeletePost.prototype.deletePost);

    return this.router;
  }
}

export const postRoutes: PostRoutes = new PostRoutes();
