import { Server, Socket } from 'socket.io';

export let postSocketIOObject: Server; //used in controller

export class PostSocketIOHandler {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
    postSocketIOObject = io;
  }

  public listen(): void {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    this.io.on('connection', (socket: Socket) => {
      console.log('Post socketio handler');
    });
  }
}
