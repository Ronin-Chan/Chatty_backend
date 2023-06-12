import { AddBlock } from '@block/controllers/addBlock';
import { RemoveBlock } from '@block/controllers/removeBlock';
import { authMiddleware } from '@global/helpers/authMiddleware';
import express, { Router } from 'express';

class BlockRoutes {
  private router: Router;

  constructor() {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.put('/user/block/:blockedUserId', authMiddleware.checkAuthentication, AddBlock.prototype.addBlock);
    this.router.put('/user/unblock/:blockedUserId', authMiddleware.checkAuthentication, RemoveBlock.prototype.removeBlock);

    return this.router;
  }
}

export const blockRoutes: BlockRoutes = new BlockRoutes();
