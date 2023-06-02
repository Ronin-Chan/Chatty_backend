import { IFileImageDocument } from '@image/interfaces/image.interface';
import { ImageModel } from '@image/models/image.schema';
import { UserModel } from '@user/models/user.schema';
import mongoose from 'mongoose';

class ImageService{
  public async addProfileImageToDB(userId: string, imgId: string, imgVersion: string, url: string): Promise<void>{
    await UserModel.updateOne({ _id: userId }, { $set: { profilePicture: url } }).exec();
    await this.addImageToDB(userId, imgId, imgVersion, 'profile');
  }

  public async addBgImageToDB(userId: string, imgId: string, imgVersion: string): Promise<void>{
    await UserModel.updateOne(
      { _id: userId },
      { $set: { bgImageVersion: imgVersion, bgImageId: imgId } }
    );
    this.addImageToDB(userId, imgId, imgVersion, 'background');
  }

  public async addImageToDB(userId: string, imgId: string, imgVersion: string, type: string): Promise<void>{
    await ImageModel.create({
      userId,
      bgImageVersion: type === 'background' ? imgVersion : '',
      bgImageId: type === 'background' ? imgId : '',
      profileImgVersion: type === 'profile' ? imgVersion : '',
      profileImgId: type === 'profile' ? imgId : '',
      imgVersion, //post's image
      imgId
    });
  }

  public async removeImageFromDB(imageId: string): Promise<void>{
    await ImageModel.deleteOne(
      { _id: imageId },
    ).exec();
  }

  public async getBgImageFromDB(bgImageId: string): Promise<IFileImageDocument> {
    const image: IFileImageDocument = (await ImageModel.findOne({ bgImageId }).exec()) as IFileImageDocument;
    return image;
  }

  public async getImagesFromDB(userId: string): Promise<IFileImageDocument[]> {
    const images: IFileImageDocument[] = await ImageModel.aggregate([{ $match: { userId: new mongoose.Types.ObjectId(userId) } }]);
    return images;
  }
}

export const imageService: ImageService = new ImageService();
