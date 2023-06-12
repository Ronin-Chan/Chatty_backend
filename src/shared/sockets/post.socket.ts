import { ICommentDocument } from '@comment/interfaces/comment.interface';
import { IReactionDocument } from '@reaction/interfaces/reaction.interface';
import { Server, Socket } from 'socket.io';

export let postSocketIOObject: Server; //used in controller

export class PostSocketIOHandler {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
    postSocketIOObject = io;
  }

  public listen(): void {
    this.io.on('connection', (socket: Socket) => {
      socket.on('reaction', (reaction: IReactionDocument) => {
        this.io.emit('update reaction', reaction);
      });

      socket.on('comment', (comment: ICommentDocument) => {
        this.io.emit('update comment', comment);
      });
    });
  }
}
