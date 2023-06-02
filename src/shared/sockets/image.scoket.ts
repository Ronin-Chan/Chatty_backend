import { Server } from 'socket.io';

export let imageSocketIOObject: Server; //used in controller

export class ImageSocketIOHandler {
  public listen(io: Server): void {
    imageSocketIOObject = io;
  }
}
