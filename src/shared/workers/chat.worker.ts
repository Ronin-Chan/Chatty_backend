import { config } from '@root/config';
import { chatService } from '@service/db/chat.service';
import { DoneCallback, Job } from 'bull';
import Logger from 'bunyan';

const log: Logger = config.createLogger('chatWorker');

class ChatWorker {
  async addChatToDB(job: Job, done: DoneCallback): Promise<void> {
    try {
      const { data } = job;
      await chatService.addChatMessageToDB(data);
      done(null, job.data); //first param is error, successful so we pass in null
    } catch (error) {
      log.error(error);
      done(error as Error);
    }
  }

  async markMessageAsDeletedInDB(job: Job, done: DoneCallback): Promise<void> {
    try {
      const { messageId, type } = job.data;
      await chatService.markMessageAsDeletedInDB(messageId, type);
      done(null, job.data); //first param is error, successful so we pass in null
    } catch (error) {
      log.error(error);
      done(error as Error);
    }
  }

  async markMessageAsReadInDB(job: Job, done: DoneCallback): Promise<void> {
    try {
      const { senderId, receiverId } = job.data;
      await chatService.markMessageAsReadInDB(senderId, receiverId);
      done(null, job.data); //first param is error, successful so we pass in null
    } catch (error) {
      log.error(error);
      done(error as Error);
    }
  }

  async updateMsgReactionInDB(job: Job, done: DoneCallback): Promise<void> {
    try {
      const { messageId, reaction, senderName, type } = job.data;
      await chatService.updateMsgReactionInDB(messageId, reaction, senderName, type);
      done(null, job.data); //first param is error, successful so we pass in null
    } catch (error) {
      log.error(error);
      done(error as Error);
    }
  }
}

export const chatWorker: ChatWorker = new ChatWorker();
