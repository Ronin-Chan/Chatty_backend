import { joiValidation } from '@global/decorators/joiValidation.decorators';
import { userQueue } from '@service/queues/user.queue';
import { UserCache } from '@service/redis/user.cache';
import { basicInfoSchema, notificationSettingsSchema, socialLinksSchema } from '@user/schemes/info.scheme';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

const userCache: UserCache = new UserCache();

export class UpdateInfoAndSetting {
  @joiValidation(basicInfoSchema)
  public async updateBasicInfo(req: Request, res: Response): Promise<void> {
    for (const [key, value] of Object.entries(req.body)) {
      await userCache.updateSingleUserItemInCache(`${req.currentUser?.userId}`, key, `${value}`);
    }
    userQueue.addUserJob('updateBasicInfoInDB', { key: `${req.currentUser?.userId}`, value: req.body });

    res.status(HTTP_STATUS.OK).json({ message: 'Updated successfully' });
  }

  @joiValidation(socialLinksSchema)
  public async updateSocialLinks(req: Request, res: Response): Promise<void> {
    await userCache.updateSingleUserItemInCache(`${req.currentUser!.userId}`, 'social', req.body);
    userQueue.addUserJob('updateSocialLinksInDB', {
      key: `${req.currentUser!.userId}`,
      value: req.body
    });
    res.status(HTTP_STATUS.OK).json({ message: 'Updated successfully' });
  }

  @joiValidation(notificationSettingsSchema)
  public async updateNotificationSettings(req: Request, res: Response): Promise<void> {
    await userCache.updateSingleUserItemInCache(`${req.currentUser!.userId}`, 'notifications', req.body);
    userQueue.addUserJob('updateNotificationSettingsInDB', {
      key: `${req.currentUser!.userId}`,
      value: req.body
    });
    res.status(HTTP_STATUS.OK).json({ message: 'Updated successfully' });
  }
}
