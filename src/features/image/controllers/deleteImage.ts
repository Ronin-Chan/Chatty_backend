import { IFileImageDocument } from '@image/interfaces/image.interface';
import { imageService } from '@service/db/image.service';
import { imageQueue } from '@service/queues/image.queue';
import { UserCache } from '@service/redis/user.cache';
import { imageSocketIOObject } from '@socket/image.scoket';
import { IUserDocument } from '@user/interfaces/user.interface';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

const userCache: UserCache = new UserCache();

export class DeleteImage{
  //use id to directly delete image docunment from mongodb - _id
  //post's image
  public async deleteImage(req: Request, res: Response): Promise<void>{
    const { imageId } = req.params;
    imageSocketIOObject.emit('delete image', imageId);
    imageQueue.addImageJob('removeImageFromDB', {
      imageId
    });
    res.status(HTTP_STATUS.OK).json({ message: 'Image deleted successfully' });
  };

  //use bgImageId to delete image document - bgImageId
  //but without setting two properties as empty string in user document
  //step: 1.get image document by bgImageId 2.get _id from image document 3.use _id to delete image document
  public async deleteBgImage(req: Request, res: Response): Promise<void> {
    const image: IFileImageDocument = await imageService.getBgImageFromDB(req.params.bgImageId);
    imageSocketIOObject.emit('delete image', image?._id);
    const cachedBgImageId: Promise<IUserDocument> = userCache.updateSingleUserItemInCache(
      `${req.currentUser!.userId}`,
      'bgImageId',
      ''
    ) as Promise<IUserDocument>;
    const cachedBgImageVersion: Promise<IUserDocument> = userCache.updateSingleUserItemInCache(
      `${req.currentUser!.userId}`,
      'bgImageVersion',
      ''
    ) as Promise<IUserDocument>;
    //optional - to set these two properties as empty string in mongodb
    await Promise.all([cachedBgImageId, cachedBgImageVersion]);
    imageQueue.addImageJob('removeImageFromDB', {
      imageId: image?._id
    });
    res.status(HTTP_STATUS.OK).json({ message: 'Image deleted successfully' });
  }

  //step: 1.get image document by profileImgId 2.get _id from image document 3.use _id to delete image document
  public async deleteProfileImage(req: Request, res: Response): Promise<void> {
    const image: IFileImageDocument = await imageService.getBgImageFromDB(req.params.profileImgId);
    imageSocketIOObject.emit('delete image', image?._id);
    imageQueue.addImageJob('removeImageFromDB', {
      imageId: image?._id
    });
    res.status(HTTP_STATUS.OK).json({ message: 'Image deleted successfully' });
  }
}


