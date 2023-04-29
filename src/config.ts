import dotenv from 'dotenv';
import bunyan from 'bunyan';

dotenv.config({}); //used to load .env

class Config {
  public DATABASE_URL: string | undefined;
  public JWT_TOKEN: string | undefined;
  public NODE_ENV: string | undefined;
  public SECRET_KEY_ONE: string | undefined;
  public SECRET_KEY_TWO: string | undefined;
  public CLIENT_URL: string | undefined;
  public REDIS_HOST: string | undefined;

  private readonly DEFAULT_DB_URL = 'mongodb://localhost:27017/chatty-backend';

  //if not found in .env, will use default
  //nodejs允许我们通过 process.env 获取当前运行环境中的所有环境变量
  constructor() {
    this.DATABASE_URL = process.env.DATABASE_URL || this.DEFAULT_DB_URL;
    this.JWT_TOKEN = process.env.JWT_TOKEN || '';
    this.NODE_ENV = process.env.NODE_ENV || '';
    this.SECRET_KEY_ONE = process.env.SECRET_KEY_ONE || '';
    this.SECRET_KEY_TWO = process.env.SECRET_KEY_TWO || '';
    this.CLIENT_URL = process.env.CLIENT_URL || '';
    this.REDIS_HOST = process.env.REDIS_HOST || '';
  }

  public createLogger(name: string): bunyan {
    return bunyan.createLogger({ name, level: 'debug' });
  }

  public validateConfig(): void {
    // console.log(this);
    for (const [key, value] of Object.entries(this)) {
      //this includes key-value pairs of properties
      if (value === undefined) {
        //e.g. DATABASE_URL:'mongodb://localhost:27017/chatty-backend'
        throw new Error(`Configuration ${key} is undefined`);
      }
    }
  }
}

export const config: Config = new Config();
