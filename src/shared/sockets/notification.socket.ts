import { Server } from 'socket.io';

export let notificationSocketIOObject: Server; //used in controller

export class NotificationSocketIOHandler {
  public listen(io: Server): void {
    notificationSocketIOObject = io;
  }
}
