import { authMiddleware } from '@global/helpers/authMiddleware';
import { ChangePwd } from '@user/controllers/changePwd';
import { GetUsers } from '@user/controllers/getUser';
import { SearchUser } from '@user/controllers/searchUser';
import { UpdateInfoAndSetting } from '@user/controllers/updateInfoAndSetting';
import express, { Router } from 'express';

class UserRoutes {
  private router: Router;

  constructor() {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.get('/user/all/:page', authMiddleware.checkAuthentication, GetUsers.prototype.getUsers);
    this.router.get('/user/profile', authMiddleware.checkAuthentication, GetUsers.prototype.getCurrentUserProfile);
    this.router.get('/user/profile/:userId', authMiddleware.checkAuthentication, GetUsers.prototype.getProfileByUserId);
    this.router.get(
      '/user/profile/posts/:username/:userId/:uId',
      authMiddleware.checkAuthentication,
      GetUsers.prototype.getProfileAndPosts
    );
    this.router.get('/user/profile/user/suggestions', authMiddleware.checkAuthentication, GetUsers.prototype.getRandomUsers);
    this.router.get('/user/profile/search/:query', authMiddleware.checkAuthentication, SearchUser.prototype.searchUser);

    this.router.put('/user/profile/change-password', authMiddleware.checkAuthentication, ChangePwd.prototype.changePwd);
    this.router.put('/user/profile/basic-info', authMiddleware.checkAuthentication, UpdateInfoAndSetting.prototype.updateBasicInfo);
    this.router.put('/user/profile/social-links', authMiddleware.checkAuthentication, UpdateInfoAndSetting.prototype.updateSocialLinks);
    this.router.put(
      '/user/profile/notifications',
      authMiddleware.checkAuthentication,
      UpdateInfoAndSetting.prototype.updateNotificationSettings
    );

    return this.router;
  }
}

export const userRoutes: UserRoutes = new UserRoutes();
