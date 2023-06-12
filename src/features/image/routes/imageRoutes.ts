import express, { Router } from 'express';
import { authMiddleware } from '@global/helpers/authMiddleware';
import { AddImage } from '@image/controllers/addImage';
import { GetImage } from '@image/controllers/getImage';
import { DeleteImage } from '@image/controllers/deleteImage';

class ImageRoutes {
  private router: Router;

  constructor() {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.get('/images/:userId', authMiddleware.checkAuthentication, GetImage.prototype.getImage);

    this.router.post('/images/profile', authMiddleware.checkAuthentication, AddImage.prototype.addProfileImage);
    this.router.post('/images/background', authMiddleware.checkAuthentication, AddImage.prototype.addBgImage);

    this.router.delete('/images/:imageId', authMiddleware.checkAuthentication, DeleteImage.prototype.deleteImage);
    this.router.delete('/images/background/:bgImageId', authMiddleware.checkAuthentication, DeleteImage.prototype.deleteBgImage);

    return this.router;
  }
}

export const imageRoutes: ImageRoutes = new ImageRoutes();
