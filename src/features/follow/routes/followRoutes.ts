import { AddFollow } from '@follow/controllers/addFollow';
import { GetFollow } from '@follow/controllers/getFollow';
import { RemoveFollow } from '@follow/controllers/removeFollow';
import { authMiddleware } from '@global/helpers/authMiddleware';
import express, { Router } from 'express';

class FollowRoutes {
  private router: Router;

  constructor() {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.get('/user/following', authMiddleware.checkAuthentication, GetFollow.prototype.getFollowee);
    this.router.get('/user/follower', authMiddleware.checkAuthentication, GetFollow.prototype.getFollower);

    this.router.put('/user/follow/:followeeId', authMiddleware.checkAuthentication, AddFollow.prototype.addFollow);
    this.router.put('/user/unfollow/:followeeId', authMiddleware.checkAuthentication, RemoveFollow.prototype.removeFollow);

    return this.router;
  }
}

export const followRoutes: FollowRoutes = new FollowRoutes();
