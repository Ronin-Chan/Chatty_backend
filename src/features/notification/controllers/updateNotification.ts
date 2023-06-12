import { notificationQueue } from '@service/queues/notification.queue';
import { notificationSocketIOObject } from '@socket/notification.socket';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

export class UpdateNotification {
  public async updateNotification(req: Request, res: Response): Promise<void> {
    const { notificationId } = req.params;
    notificationSocketIOObject.emit('update notification', notificationId);
    notificationQueue.addNotificationJob('updateNotificationInDB', { notificationId: notificationId });
    res.status(HTTP_STATUS.OK).json({ message: 'Notification marked as read' });
  }
}
