import { ChattyServer } from './setupServer';
import express, { Express } from 'express';
import databaseConnection from './setupDatabase';
import { config } from './config';

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
  }
}

const application: App = new App();
application.initialize();
