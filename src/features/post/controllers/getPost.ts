import { IPostDocument } from '@post/interfaces/post.interface';
import HTTP_STATUS from 'http-status-codes';
import { Request, Response } from 'express';
import { PostCache } from '@service/redis/post.cache';
import { postService } from '@service/db/post.service';

const postCache: PostCache = new PostCache();
const PAGE_SIZE = 10;

export class GetPost {
  public async getPosts(req: Request, res: Response): Promise<void> {
    const { page } = req.params;
    const skip: number = (parseInt(page) - 1) * PAGE_SIZE; //mongodb 0 - 10, 10 - 20
    const limit: number = parseInt(page) * PAGE_SIZE;
    const start: number = skip === 0 ? skip : skip + 1; //redis 0 - 10, 11 - 20
    const end: number = parseInt(page) * PAGE_SIZE;

    let posts: IPostDocument[] = [];
    let totalPosts = 0;
    const cachePosts: IPostDocument[] = await postCache.getPostsFromCache('post', start, end);

    if (cachePosts.length > 0) {
      posts = cachePosts;
      totalPosts = await postCache.getTotalPostsInCache();
    } else {
      posts = await postService.getPosts({}, skip, limit, { createdAt: -1 });
      totalPosts = await postService.postsCount();
    }

    res.status(HTTP_STATUS.OK).json({ message: 'All posts', posts, totalPosts });
  }

  public async getPostsWithImages(req: Request, res: Response): Promise<void> {
    const { page } = req.params;
    const skip: number = (parseInt(page) - 1) * PAGE_SIZE;
    const limit: number = parseInt(page) * PAGE_SIZE;
    const start: number = skip === 0 ? skip : skip + 1; //redis 0 - 10, 11 - 20
    const end: number = parseInt(page) * PAGE_SIZE;
    let posts: IPostDocument[] = [];
    const cachedPosts: IPostDocument[] = await postCache.getPostsWithImagesFromCache('post', start, end);
    posts = cachedPosts.length ? cachedPosts : await postService.getPosts({ imgId: '$ne', gifUrl: '$ne' }, skip, limit, { createdAt: -1 });
    res.status(HTTP_STATUS.OK).json({ message: 'All posts with images', posts });
  }
}
