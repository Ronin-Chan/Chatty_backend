import { IFollowers } from '@follow/interfaces/follow.interface';
import { Server, Socket } from 'socket.io';

export let followSocketIOObject: Server; //used in controller

export class FollowSocketIOHandler {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
    followSocketIOObject = io;
  }

  public listen(): void {
    this.io.on('connection', (socket: Socket) => {
      socket.on('unfollow', (data: IFollowers) => {
        this.io.emit('remove follower', data);
      });
    });
  }
}
