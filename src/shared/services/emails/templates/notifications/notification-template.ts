import fs from 'fs';
import ejs from 'ejs';
import { INotificationTemplate } from '@notification/interfaces/notification.interface';

class NotificationTemplate {
  public notificationMessageTemplate(templateParams: INotificationTemplate): string {
    const { username, header, message } = templateParams;
    return ejs.render(fs.readFileSync(__dirname + '/notification-template.ejs', 'utf8'), {
      username,
      header,
      message,
      image_url: 'https://img.wxcha.com/m00/cf/e5/2fa674804a43b403f12a1024cdbef184.jpg'
    });
  }
}

export const notificationTemplate: NotificationTemplate = new NotificationTemplate();
