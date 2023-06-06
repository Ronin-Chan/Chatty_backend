import { ObjectId } from 'mongodb';
import mongoose, { Document } from 'mongoose';
import { IUserDocument } from '@user/interfaces/user.interface';

export interface IFollowers {
  userId: string;
}

export interface IFollowDocument extends Document {
  _id: mongoose.Types.ObjectId | string;
  followerId: mongoose.Types.ObjectId;
  followeeId: mongoose.Types.ObjectId;
  createdAt?: Date;
}

export interface IFollow {
  _id: mongoose.Types.ObjectId | string;
  followeeId?: IFollowData;
  followerId?: IFollowData;
  createdAt?: Date;
}

export interface IFollowData {
  avatarColor: string;
  followersCount: number;
  followingCount: number;
  profilePicture: string;
  postCount: number;
  username: string;
  uId: string;
  _id?: mongoose.Types.ObjectId;
  userProfile?: IUserDocument;
}

export interface IFollowJobData {
  userId?: string;
  followeeId?: string;
  username?: string;
  followDocumentId?: ObjectId;
}
