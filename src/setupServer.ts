import { createAdapter } from '@socket.io/redis-adapter';
import compression from 'compression';
import cookieSession from 'cookie-session';
import cors from 'cors';
import { Application, NextFunction, Request, Response, json, urlencoded } from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import http from 'http';
import HTTP_STATUS from 'http-status-codes';
import { createClient } from 'redis';
import { Server } from 'socket.io';
import { config } from '@root/config';
import applicationRoutes from '@root/route';

import { CustomError, IErrorResponse } from '@global/helpers/errorHandler';
import Logger from 'bunyan';
import { PostSocketIOHandler } from '@socket/post.socket';
import { FollowSocketIOHandler } from '@socket/follow.socket';
import { UserSocketIOHandler } from '@socket/user.socket';
import { NotificationSocketIOHandler } from '@socket/notification.socket';
import { ImageSocketIOHandler } from '@socket/image.scoket';
import { ChatSocketIOHandler } from '@socket/chat.socket';
import apiStats from 'swagger-stats';

const SERVER_PORT = 5000;
const log: Logger = config.createLogger('server');

export class ChattyServer {
  private app: Application;

  constructor(app: Application) {
    //type comes from express
    this.app = app;
  }

  public start(): void {
    this.securityMiddleware(this.app);
    this.standardMiddleware(this.app);
    this.routesMiddleware(this.app);
    this.apiMonitoring(this.app);
    this.startServer(this.app);
    this.globalErrorHandler(this.app);
  }

  private securityMiddleware(app: Application): void {
    app.use(
      cookieSession({
        name: 'session',
        keys: [config.SECRET_KEY_ONE!, config.SECRET_KEY_TWO!], //normally use process.env.xxx
        maxAge: 24 * 7 * 3600000, //time to live
        secure: config.NODE_ENV !== 'development'
      })
    );
    app.use(hpp());
    app.use(helmet());
    app.use(
      cors({
        origin: config.CLIENT_URL, //client's URL
        credentials: true, //enable to use cookie
        optionsSuccessStatus: 200,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
      })
    );
  }

  private standardMiddleware(app: Application): void {
    app.use(compression());
    app.use(json({ limit: '50mb' })); ///size of request or response is within 50MB
    app.use(urlencoded({ extended: true, limit: '50mb' }));
  }

  private routesMiddleware(app: Application): void {
    applicationRoutes(app);
  }

  private apiMonitoring(app: Application):void {
    app.use(
      apiStats.getMiddleware({
        uriPath: '/api-monitoring'
      })
    );
  }

  private globalErrorHandler(app: Application): void {
    app.all('*', (req: Request, res: Response) => {
      res.status(HTTP_STATUS.NOT_FOUND).json({ message: `${req.originalUrl} not found` });
    });

    app.use((error: IErrorResponse, _req: Request, res: Response, next: NextFunction) => {
      log.error(error);
      if (error instanceof CustomError) {
        return res.status(error.statusCode).json(error.serializeErrors());
      }
      next();
    });
  }

  private async startServer(app: Application): Promise<void> {
    try {
      const httpServer: http.Server = new http.Server(app);
      const socketIO: Server = await this.createSocketIO(httpServer);
      this.startHttpServer(httpServer);
      this.socketIOConnections(socketIO);
    } catch (error) {
      log.error(error);
    }
  }

  private async createSocketIO(httpServer: http.Server): Promise<Server> {
    const io: Server = new Server(httpServer, {
      cors: {
        origin: config.CLIENT_URL,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
      }
    });
    const pubClient = createClient({ url: config.REDIS_HOST });
    const subClient = pubClient.duplicate();
    await Promise.all([pubClient.connect(), subClient.connect()]);
    io.adapter(createAdapter(pubClient, subClient));
    return io;
  }

  private startHttpServer(httpServer: http.Server): void {
    log.info(`Server has started with process ${process.pid}`);
    httpServer.listen(SERVER_PORT, () => {
      log.info(`Server runs on port ${SERVER_PORT}`);
    });
  }

  private socketIOConnections(io: Server): void {
    const postSocketIOHandle: PostSocketIOHandler = new PostSocketIOHandler(io);
    const followSocketIOHandle: FollowSocketIOHandler = new FollowSocketIOHandler(io);
    const userSocketIOHandle: UserSocketIOHandler = new UserSocketIOHandler(io);
    const notificationSocketIOHandler: NotificationSocketIOHandler = new NotificationSocketIOHandler();
    const imageSocketIOObject: ImageSocketIOHandler = new ImageSocketIOHandler();
    const chatSocketIOObject: ChatSocketIOHandler = new ChatSocketIOHandler(io);

    postSocketIOHandle.listen();
    followSocketIOHandle.listen();
    userSocketIOHandle.listen();
    notificationSocketIOHandler.listen(io);
    imageSocketIOObject.listen(io);
    chatSocketIOObject.listen();
  }
}
