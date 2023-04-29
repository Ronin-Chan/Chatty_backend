import mongoose from 'mongoose';
import { config } from './config';
import Logger from 'bunyan';

const log: Logger = config.createLogger('server');

export default () => {
  const connect = () => {
    mongoose
      .connect(config.DATABASE_URL!)
      .then(() => {
        log.info('Successfully connected to mongodb');
      })
      .catch((error) => {
        log.error('failed to connect mongodb, error:' + error);
      });
  };

  connect();
  mongoose.connection.on('disconnected', connect); //reconnect when 'disconnected'
};
