import { AddChatMessage } from '@chat/controllers/addChatMessage';
import { AddMessageReaction } from '@chat/controllers/addMessageReaction';
import { DeleteChatMessage } from '@chat/controllers/deleteChatMessage';
import { GetChatMessage } from '@chat/controllers/getChatMessage';
import { UpdateChatMessage } from '@chat/controllers/updateChatMessage';
import { authMiddleware } from '@global/helpers/authMiddleware';
import express, { Router } from 'express';

class ChatRoutes {
  private router: Router;

  constructor() {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.get('/chat/message/conversation-list', authMiddleware.checkAuthentication, GetChatMessage.prototype.getLastChatMessages);
    this.router.get('/chat/message/user/:receiverId', authMiddleware.checkAuthentication, GetChatMessage.prototype.getChatMessages);

    this.router.post('/chat/message', authMiddleware.checkAuthentication, AddChatMessage.prototype.addChatMessage);
    this.router.post('/chat/message/add-chat-users', authMiddleware.checkAuthentication, AddChatMessage.prototype.addChatUser);
    this.router.post('/chat/message/remove-chat-users', authMiddleware.checkAuthentication, AddChatMessage.prototype.removeChatUser);

    this.router.delete(
      '/chat/message/mark-as-deleted/:messageId/:senderId/:receiverId/:type',
      authMiddleware.checkAuthentication,
      DeleteChatMessage.prototype.deleteChatMessage
    );

    this.router.put('/chat/message/mark-as-read', authMiddleware.checkAuthentication, UpdateChatMessage.prototype.updateChatMessages);
    this.router.put('/chat/message/reaction', authMiddleware.checkAuthentication, AddMessageReaction.prototype.addMessageReaction);

    return this.router;
  }
}

export const chatRoutes: ChatRoutes = new ChatRoutes();
