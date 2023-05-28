import { ISocketData } from '@user/interfaces/user.interface';
import { Server, Socket } from 'socket.io';

export let UserSocketIOObject: Server;

export class UserSocketIOHandler {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
    UserSocketIOObject = io;
  }

  public listen(): void {
    this.io.on('connection', (socket: Socket) => {
      socket.on('block user', (data: ISocketData) => {
        this.io.emit('blocked user id', data);
      });

      socket.on('unblock user', (data: ISocketData) => {
        this.io.emit('unblocked user id', data);
      });
    });
  }
}
