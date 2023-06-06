import { Request, Response } from 'express';
import { Server } from 'socket.io';
import { authUserPayload } from '@root/mocks/auth.mock';
import * as notificationServer from '@socket/notification.socket';
import { notificationMockRequest, notificationMockResponse } from '@root/mocks/notification.mock';
import { notificationQueue } from '@service/queues/notification.queue';
import { UpdateNotification } from '@notification/controllers/updateNotification';

jest.useFakeTimers();
jest.mock('@service/queues/base.queue');

Object.defineProperties(notificationServer, {
  notificationSocketIOObject: {
    value: new Server(),
    writable: true
  }
});

describe('UpdateNotification', () => {
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

    await UpdateNotification.prototype.updateNotification(req, res);
    expect(notificationServer.notificationSocketIOObject.emit).toHaveBeenCalledWith('update notification', req.params.notificationId);
    expect(notificationQueue.addNotificationJob).toHaveBeenCalledWith('updateNotificationInDB', {
      notificationId: req.params.notificationId
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Notification marked as read'
    });
  });
});
