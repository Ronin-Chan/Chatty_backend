import { ChattyServer } from '@root/setupServer';
import express, { Express } from 'express';
import databaseConnection from '@root/setupDatabase';
import { config } from '@root/config';
import Logger from 'bunyan';

const log: Logger = config.createLogger('app');

class App {
  public initialize(): void {
    this.loadConfig();
    databaseConnection();
    const app: Express = express();
    const server: ChattyServer = new ChattyServer(app); //using constructor
    server.start();
    App.handleExit();
  }

  private static handleExit(): void{
    process.on('uncaughtException', (error: Error) => {
      log.error(`There was an uncaught error: ${error}`);
    });

    process.on('unhandledRejection', (reason: Error) => {
      log.error(`Unhandled rejection at promise: ${reason}`);
      App.shutDownProperly(2);
    });

    process.on('SIGTERM', () => {
      log.error('Caught SIGTERM');
      App.shutDownProperly(2);
    });

    process.on('SIGINT', () => {
      log.error('Caught SIGINT');
      App.shutDownProperly(2);
    });

    process.on('exit', () => {
      log.error('Exiting');
    });
  }

  private static shutDownProperly(exitCode: number): void{
    Promise.resolve()
      .then(() => {
        log.info('Shutdown complete');
        process.exit(exitCode);
      })
      .catch((error) => {
        log.error(`Error during shutdown: ${error}`);
        process.exit(1);
      });
  }

  private loadConfig(): void {
    config.validateConfig();
    config.cloudinaryConfig();
  }
}

const application: App = new App();
application.initialize();
