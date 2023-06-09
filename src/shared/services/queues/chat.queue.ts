import { IChatJobData, IMessageData } from '@chat/interfaces/chat.interface';
import { BaseQueue } from '@service/queues/base.queue';
import { chatWorker } from '@worker/chat.worker';

class ChatQueue extends BaseQueue {
  constructor() {
    super('chat');
    this.processJob('addChatMessageToDB', 5, chatWorker.addChatToDB);
    this.processJob('markMessageAsDeletedInDB', 5, chatWorker.markMessageAsDeletedInDB);
    this.processJob('markMessageAsReadInDB', 5, chatWorker.markMessageAsReadInDB);
    this.processJob('updateMsgReactionInDB', 5, chatWorker.updateMsgReactionInDB);
  }

  public addChatJob(name: string, data: IChatJobData | IMessageData): void {
    this.addJob(name, data);
  }
}

export const chatQueue: ChatQueue = new ChatQueue();
