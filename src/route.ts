import { notificationRoutes } from '@notification/routes/notificationRoutes';
import { authRoutes } from '@auth/routes/authRoutes';
import { currentUserRoutes } from '@auth/routes/currentUserRoutes';
import { blockRoutes } from '@block/routes/blockRoutes';
import { commentRoutes } from '@comment/routes/commentRoutes';
import { followRoutes } from '@follow/routes/followRoutes';
import { authMiddleware } from '@global/helpers/authMiddleware';
import { postRoutes } from '@post/routes/postRoutes';
import { reationRoutes } from '@reaction/routes/reactionRoutes';
import { serverAdapter } from '@service/queues/base.queue';
import { Application } from 'express';
import { imageRoutes } from '@image/routes/imageRoutes';
import { chatRoutes } from '@chat/routes/chatRoutes';
import { userRoutes } from '@user/routes/userRoutes';
import { healthRoutes } from './features/health/routes/healthRoutes';

const BASE_PATH = '/api/v1';

export default (app: Application) => {
  const routes = () => {
    app.use('/queues', serverAdapter.getRouter()); //must the same as serverAdapter.setBasePath('/queues') in base.queue.ts
    app.use(BASE_PATH, authRoutes.routes());
    app.use(BASE_PATH, authRoutes.signoutRoute());
    app.use('', healthRoutes.health());
    app.use('', healthRoutes.env());
    app.use('', healthRoutes.instance());
    app.use('', healthRoutes.fiboRoutes());

    app.use(BASE_PATH, authMiddleware.verify, currentUserRoutes.routes());
    app.use(BASE_PATH, authMiddleware.verify, postRoutes.routes());
    app.use(BASE_PATH, authMiddleware.verify, reationRoutes.routes());
    app.use(BASE_PATH, authMiddleware.verify, commentRoutes.routes());
    app.use(BASE_PATH, authMiddleware.verify, followRoutes.routes());
    app.use(BASE_PATH, authMiddleware.verify, blockRoutes.routes());
    app.use(BASE_PATH, authMiddleware.verify, notificationRoutes.routes());
    app.use(BASE_PATH, authMiddleware.verify, imageRoutes.routes());
    app.use(BASE_PATH, authMiddleware.verify, chatRoutes.routes());
    app.use(BASE_PATH, authMiddleware.verify, userRoutes.routes());
  };

  routes();
};
