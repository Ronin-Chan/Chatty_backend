import { authMiddleware } from '@global/helpers/authMiddleware';
import { AddReaction } from '@reaction/controllers/addReaction';
import { GetReaction } from '@reaction/controllers/getReaction';
import { RemoveReaction } from '@reaction/controllers/removeReaction';
import express, { Router } from 'express';

class ReactionRoutes {
  private router: Router;

  constructor() {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.get('/post/reactions/:postId', authMiddleware.checkAuthentication, GetReaction.prototype.getReactions);
    this.router.get(
      '/post/single/reaction/:postId/:username',
      authMiddleware.checkAuthentication,
      GetReaction.prototype.getSingleReactionByUsername
    );
    this.router.get('/post/reactions/username/:username', authMiddleware.checkAuthentication, GetReaction.prototype.getReactionsByUsername);

    this.router.post('/post/reaction', authMiddleware.checkAuthentication, AddReaction.prototype.addReaction);

    this.router.delete(
      '/post/reaction/:postId/:previousReaction/:postReactions',
      authMiddleware.checkAuthentication,
      RemoveReaction.prototype.removeReaction
    );

    return this.router;
  }
}

export const reationRoutes: ReactionRoutes = new ReactionRoutes();
