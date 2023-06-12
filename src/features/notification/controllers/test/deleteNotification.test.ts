import { Request, Response } from 'express';
import { Server } from 'socket.io';
import { authUserPayload } from '@root/mocks/auth.mock';
import * as notificationServer from '@socket/notification.socket';
import { notificationMockRequest, notificationMockResponse } from '@root/mocks/notification.mock';
import { notificationQueue } from '@service/queues/notification.queue';
import { DeleteNotification } from '@notification/controllers/deleteNotification';

jest.useFakeTimers();
jest.mock('@service/queues/base.queue');

Object.defineProperties(notificationServer, {
  notificationSocketIOObject: {
    value: new Server(),
    writable: true
  }
});

describe('DeleteNotification', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  it('should send correct json response', async () => {
    const req: Request = notificationMockRequest({}, authUserPayload, { notificationId: '12345' }) as Request;
    const res: Response = notificationMockResponse();
    jest.spyOn(notificationServer.notificationSocketIOObject, 'emit');
    jest.spyOn(notificationQueue, 'addNotificationJob');

    await DeleteNotification.prototype.deleteNotification(req, res);
    expect(notificationServer.notificationSocketIOObject.emit).toHaveBeenCalledWith('delete notification', req.params.notificationId);
    expect(notificationQueue.addNotificationJob).toHaveBeenCalledWith('deleteNotificationFromDB', {
      notificationId: req.params.notificationId
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Notification deleted successfully'
    });
  });
});
