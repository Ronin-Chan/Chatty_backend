import { authRoutes } from '@auth/routes/authRoutes';
import { currentUserRoutes } from '@auth/routes/currentUserRoutes';
import { blockRoutes } from '@block/routes/blockRoutes';
import { commentRoutes } from '@comment/routes/commentRouters';
import { followRoutes } from '@follow/routes/followRoutes';
import { authMiddleware } from '@global/helpers/authMiddleware';
import { postRoutes } from '@post/routes/postRoutes';
import { reationRoutes } from '@reaction/routes/reactionRoutes';
import { serverAdapter } from '@service/queues/base.queue';
import { Application } from 'express';

const BASE_PATH = '/api/v1';

export default (app: Application) => {
  const routes = () => {
    app.use('/queues', serverAdapter.getRouter()); //must the same as serverAdapter.setBasePath('/queues') in base.queue.ts
    app.use(BASE_PATH, authRoutes.routes());
    app.use(BASE_PATH, authRoutes.signoutRoute());

    app.use(BASE_PATH, authMiddleware.verify, currentUserRoutes.routes());
    app.use(BASE_PATH, authMiddleware.verify, postRoutes.routes());
    app.use(BASE_PATH, authMiddleware.verify, reationRoutes.routes());
    app.use(BASE_PATH, authMiddleware.verify, commentRoutes.routes());
    app.use(BASE_PATH, authMiddleware.verify, followRoutes.routes());
    app.use(BASE_PATH, authMiddleware.verify, blockRoutes.routes());
  };

  routes();
};
