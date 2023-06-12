import HTTP_STATUS from 'http-status-codes';
import { IAuthDocument, ISignUpData } from '@auth/interfaces/auth.interface';
import { signupSchema } from '@auth/schemes/signup';
import { joiValidation } from '@global/decorators/joiValidation.decorators';
import { uploads } from '@global/helpers/cloudinaryUpload';
import { BadRequestError } from '@global/helpers/errorHandler';
import { Helpers } from '@global/helpers/helpers';
import { authService } from '@service/db/auth.service';
import { UploadApiResponse } from 'cloudinary';
import { NextFunction, Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { config } from '@root/config';
import { IUserDocument } from '@user/interfaces/user.interface';
import { UserCache } from '@service/redis/user.cache';
import { omit } from 'lodash';
import { authQueue } from '@service/queues/auth.queue';
import { userQueue } from '@service/queues/user.queue';
import JWT from 'jsonwebtoken';

const userCache: UserCache = new UserCache();

export class SignUp {
  @joiValidation(signupSchema)
  public async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { username, email, password, avatarColor, avatarImage } = req.body;
    const checkIfUserExist: IAuthDocument = await authService.getUserByUsernameOrEmail(username, email);
    if (checkIfUserExist) {
      throw new BadRequestError('Invalid credentials');
    }

    const authObjectId: ObjectId = new ObjectId();
    const userObjectId: ObjectId = new ObjectId(); //redis - ZADD - value
    const uId = `${Helpers.generateRandomIntegers(12)}`; //redis - ZADD - score
    const authData: IAuthDocument = SignUp.prototype.signupData({
      _id: authObjectId,
      uId,
      username,
      password,
      email,
      avatarColor
    });

    //userObjectId is unique for every user
    const result: UploadApiResponse = (await uploads(avatarImage, `${userObjectId}`, true, true)) as UploadApiResponse;
    if (!result?.public_id) {
      //if successful, it will return public_id
      // throw new BadRequestError('Fail to upload file. Try again.');
      return next(new BadRequestError('File upload: Error occurred. Try again.'));
    }

    // Add to redis cache
    const userDataForCache: IUserDocument = SignUp.prototype.userData(authData, userObjectId);
    userDataForCache.profilePicture = `https://res.cloudinary.com/${config.CLOUD_NAME}/image/upload/v${result.version}/${userObjectId}`;
    await userCache.saveUserToCache(`${userObjectId}`, uId, userDataForCache);

    // Add to database
    // omit some properties from data, we don't need them to save to db. Must use return data.
    //acutually we don't need to omit, because in the IUserDocument which doesn't contain those properties.
    const Omitresult = omit(userDataForCache, ['uId', 'username', 'email', 'avatarColor', 'password']);
    authQueue.addAuthUserJob('addAuthUserToDB', { value: authData });
    userQueue.addUserJob('addUserToDB', { value: Omitresult });

    const userJwt: string = SignUp.prototype.signToken(authData, userObjectId);
    req.session = { jwt: userJwt };

    res.status(HTTP_STATUS.CREATED).json({ message: 'User created successfully', user: userDataForCache, token: userJwt });
  }

  private signToken(data: IAuthDocument, userObjectId: ObjectId): string {
    return JWT.sign(
      {
        userId: userObjectId,
        uId: data.uId,
        email: data.email,
        username: data.username,
        avatarColor: data.avatarColor
      },
      config.JWT_TOKEN!
    );
  }

  private signupData(data: ISignUpData): IAuthDocument {
    const { _id, username, email, uId, password, avatarColor } = data;
    return {
      _id,
      uId,
      username: Helpers.firstLetterUppercase(username),
      email: Helpers.lowerCase(email),
      password,
      avatarColor,
      createdAt: new Date()
    } as IAuthDocument;
  }

  public userData(data: IAuthDocument, userObjectId: ObjectId): IUserDocument {
    const { _id, username, email, uId, password, avatarColor } = data;
    return {
      _id: userObjectId,
      authId: _id,
      uId,
      username: Helpers.firstLetterUppercase(username),
      email,
      password,
      avatarColor,
      profilePicture: '',
      blocked: [],
      blockedBy: [],
      work: '',
      location: '',
      school: '',
      quote: '',
      bgImageVersion: '',
      bgImageId: '',
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      notifications: {
        messages: true,
        reactions: true,
        comments: true,
        follows: true
      },
      social: {
        facebook: '',
        instagram: '',
        twitter: '',
        youtube: ''
      }
    } as unknown as IUserDocument;
  }
}
