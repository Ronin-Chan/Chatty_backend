import { notificationQueue } from '@service/queues/notification.queue';
import { notificationSocketIOObject } from '@socket/notification.socket';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

export class DeleteNotification {
  public async deleteNotification(req: Request, res: Response): Promise<void> {
    const { notificationId } = req.params;
    notificationSocketIOObject.emit('delete notification', notificationId);
    notificationQueue.addNotificationJob('deleteNotificationFromDB', { notificationId: notificationId });
    res.status(HTTP_STATUS.OK).json({ message: 'Notification deleted successfully' });
  }
}
