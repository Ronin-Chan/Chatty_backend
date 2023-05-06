import mongoose from 'mongoose';
import { config } from '@root/config';
import Logger from 'bunyan';
import { redisConnection } from '@service/redis/redis.connection';

const log: Logger = config.createLogger('server');

export default () => {
  const connect = () => {
    mongoose
      .connect(config.DATABASE_URL!)
      .then(() => {
        log.info('Successfully connected to database');
        redisConnection.connect();
      })
      .catch((error) => {
        log.error('failed to connect mongodb, error:' + error);
      });
  };

  connect();
  mongoose.connection.on('disconnected', connect); //reconnect when 'disconnected'
};
