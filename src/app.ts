import { ChattyServer } from '@root/setupServer';
import express, { Express } from 'express';
import databaseConnection from '@root/setupDatabase';
import { config } from '@root/config';

class App {
  public initialize(): void {
    this.loadConfig();
    databaseConnection();
    const app: Express = express();
    const server: ChattyServer = new ChattyServer(app); //using constructor
    server.start();
  }

  private loadConfig(): void {
    config.validateConfig();
    config.cloudinaryConfig();
  }
}

const application: App = new App();
application.initialize();
