import { INotificationJobData } from '@notification/interfaces/notification.interface';
import { BaseQueue } from '@service/queues/base.queue';
import { notificationWorker } from '@worker/notification.worker';

class NotificationQueue extends BaseQueue {
  constructor() {
    super('notification');
    this.processJob('updateNotificationInDB', 5, notificationWorker.updateNotificationInDB);
    this.processJob('deleteNotificationFromDB', 5, notificationWorker.deleteNotificationFromDB);
  }

  public addNotificationJob(name: string, data: INotificationJobData): void {
    this.addJob(name, data);
  }
}

export const notificationQueue: NotificationQueue = new NotificationQueue();
