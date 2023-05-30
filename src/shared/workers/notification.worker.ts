import { DoneCallback, Job } from 'bull';
import Logger from 'bunyan';
import { config } from '@root/config';
import { notificationService } from '@service/db/notification.service';

const log: Logger = config.createLogger('notificationWorker');

class NotificationWorker {
  async updateNotificationInDB(job: Job, done: DoneCallback): Promise<void> {
    try {
      const { notificationId } = job.data;
      await notificationService.updateNotificationInDB(notificationId);
      job.progress(100);
      done(null, job.data);
    } catch (error) {
      log.error(error);
      done(error as Error);
    }
  }

  async deleteNotificationFromDB(job: Job, done: DoneCallback): Promise<void> {
    try {
      const { notificationId } = job.data;
      await notificationService.deleteNotificationFromDB(notificationId);
      job.progress(100);
      done(null, job.data);
    } catch (error) {
      log.error(error);
      done(error as Error);
    }
  }
}

export const notificationWorker: NotificationWorker = new NotificationWorker();
