import { NextFunction, Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import { joiValidation } from '@global/decorators/joiValidation.decorators';
import { addImageSchema } from '@image/schemes/image.schemes';
import { uploads } from '@global/helpers/cloudinaryUpload';
import { UploadApiResponse } from 'cloudinary';
import { BadRequestError } from '@global/helpers/errorHandler';
import { UserCache } from '@service/redis/user.cache';
import { IUserDocument } from '@user/interfaces/user.interface';
import { imageSocketIOObject } from '@socket/image.scoket';
import { imageQueue } from '@service/queues/image.queue';
import { Helpers } from '@global/helpers/helpers';
import { IBgUploadResponse } from '@image/interfaces/image.interface';

const userCache: UserCache = new UserCache();

export class AddImage{
  @joiValidation(addImageSchema)
  public async addProfileImage(req: Request, res: Response, next: NextFunction): Promise<void>{
    const result: UploadApiResponse = (await uploads(req.body.image, `${req.currentUser!.userId}`, true, true)) as UploadApiResponse;
    if (!result?.public_id) {
      return next(new BadRequestError('File upload: Error occurred. Try again.'));
    }
    const url = `https://res.cloudinary.com/dlohvpcwg/image/upload/v${result.version}/${result.public_id}`;
    const cachedUser: IUserDocument = await userCache.updateSingleUserItemInCache(`${req.currentUser!.userId}`, 'profilePicture', url) as IUserDocument;
    imageSocketIOObject.emit('update user', cachedUser);
    imageQueue.addImageJob('addProfileImageToDB', { userId: cachedUser.id, imgId: result.public_id, imgVersion: result.version.toString(), url });

    res.status(HTTP_STATUS.OK).json({ message: 'Image added successfully' });
  }

  @joiValidation(addImageSchema)
  public async addBgImage(req: Request, res: Response, next: NextFunction): Promise<void>{
    const { bgImgId, bgImgVersion }: IBgUploadResponse = await AddImage.prototype.bgImageUpload(req.body.image, next);
    const updateBgImgId: Promise<IUserDocument> = userCache.updateSingleUserItemInCache(`${req.currentUser!.userId}`, 'bgImageId', bgImgId) as Promise<IUserDocument>;
    const updateBgImgVersion: Promise<IUserDocument> = userCache.updateSingleUserItemInCache(`${req.currentUser!.userId}`, 'bgImageVersion', bgImgVersion) as Promise<IUserDocument>;
    const result: [IUserDocument, IUserDocument] = await Promise.all([updateBgImgId, updateBgImgVersion]);

    imageSocketIOObject.emit('update user', {
      bgImageId: bgImgId,
      bgImageVersion: bgImgVersion,
      user: result[1]
    });
    imageQueue.addImageJob('addBgImageToDB', {
      userId: `${req.currentUser!.userId}`,
      imgId: bgImgId,
      imgVersion: bgImgVersion
    });

    res.status(HTTP_STATUS.OK).json({ message: 'Image added successfully' });
  }

  private async bgImageUpload(image: string, next: NextFunction): Promise<IBgUploadResponse>{
    const res: boolean = Helpers.isDataURL(image);
    let bgImgId = '';
    let bgImgVersion = '';
    if(res){
      const result: UploadApiResponse = (await uploads(image)) as UploadApiResponse;
      if (!result?.public_id) {
        next(new BadRequestError('File upload: Error occurred. Try again.'));
      }else{
        bgImgVersion = result.version.toString();
        bgImgId = result.public_id;
      }
    } else{
      const list: string[] = image.split('/');
      bgImgVersion = list[list.length - 2];
      bgImgId = list[list.length - 1];
    }
    return { bgImgVersion: bgImgVersion.replace(/v/g, ''), bgImgId };
  }
}

