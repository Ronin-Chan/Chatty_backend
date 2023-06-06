import { authMiddleware } from '@global/helpers/authMiddleware';
import { DeleteNotification } from '@notification/controllers/deleteNotification';
import { GetNotifications } from '@notification/controllers/getNotifications';
import { UpdateNotification } from '@notification/controllers/updateNotification';
import express, { Router } from 'express';

class NotificationRoutes {
  private router: Router;

  constructor() {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.get('/notifications', authMiddleware.checkAuthentication, GetNotifications.prototype.getNotifications);
    this.router.put('/notification/:notificationId', authMiddleware.checkAuthentication, UpdateNotification.prototype.updateNotification);
    this.router.delete(
      '/notification/:notificationId',
      authMiddleware.checkAuthentication,
      DeleteNotification.prototype.deleteNotification
    );

    return this.router;
  }
}

export const notificationRoutes: NotificationRoutes = new NotificationRoutes();
