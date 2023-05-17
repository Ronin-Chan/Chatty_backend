import { ICommentDocument, ICommentNameList } from '@comment/interfaces/comment.interface';
import { IJWT } from './auth.mock';
import { Response } from 'express';
import { AuthPayload } from '@auth/interfaces/auth.interface';

export const commentMockRequest = (sessionData: IJWT, body: IBody, currentUser?: AuthPayload | null, params?: IParams) => ({
  session: sessionData,
  body,
  params,
  currentUser
});

export const commentMockResponse = (): Response => {
  const res: Response = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

export interface IBody {
  postId?: string;
  comment?: string;
}

export interface IParams {
  postId?: string;
  commentId?: string;
}

export const commentsData: ICommentDocument = {
  _id: '6464ef73c51f9645e3986cb0',
  username: 'Danny',
  avatarColor: '#9c27b0',
  postId: '645b4c0fff825ced1b3f4345',
  profilePicture: 'https://res.cloudinary.com/ratingapp/image/upload/6064793b091bf02b6a71067a',
  comment: 'This is a comment',
  createdAt: new Date(),
  userTo: '60263f14648fed5246e322d9'
} as unknown as ICommentDocument;

export const commentNames: ICommentNameList = {
  count: 1,
  names: ['Danny']
};
