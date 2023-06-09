import dotenv from 'dotenv';
import bunyan from 'bunyan';
import cloudinary from 'cloudinary';

dotenv.config({}); //used to load .env

class Config {
  public DATABASE_URL: string | undefined;
  public JWT_TOKEN: string | undefined;
  public NODE_ENV: string | undefined;
  public SECRET_KEY_ONE: string | undefined;
  public SECRET_KEY_TWO: string | undefined;
  public CLIENT_URL: string | undefined;
  public REDIS_HOST: string | undefined;
  public CLOUD_NAME: string | undefined;
  public CLOUD_API_KEY: string | undefined;
  public CLOUD_API_SECRET: string | undefined;
  public SENDER_EMAIL: string | undefined;
  public SENDER_EMAIL_PASSWORD: string | undefined;
  public SENDGRID_API_KEY: string | undefined;
  public SENDGRID_SENDER: string | undefined;
  public SENDCLOUD_EMAIL: string | undefined;
  public SENDCLOUD_API_KEY: string | undefined;
  public SENDCLOUD_API_USER: string | undefined;
  public EC2_URL: string | undefined;

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
    this.CLOUD_NAME = process.env.CLOUD_NAME || '';
    this.CLOUD_API_KEY = process.env.CLOUD_API_KEY || '';
    this.CLOUD_API_SECRET = process.env.CLOUD_API_SECRET || '';
    this.SENDER_EMAIL = process.env.SENDER_EMAIL || '';
    this.SENDER_EMAIL_PASSWORD = process.env.SENDER_EMAIL_PASSWORD || '';
    this.SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';
    this.SENDGRID_SENDER = process.env.SENDGRID_SENDER || '';
    this.SENDCLOUD_EMAIL = process.env.SENDCLOUD_EMAIL || '';
    this.SENDCLOUD_API_KEY = process.env.SENDCLOUD_API_KEY || '';
    this.SENDCLOUD_API_USER = process.env.SENDCLOUD_API_USER || '';
    this.EC2_URL = process.env.EC2_URL || '';
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

  public cloudinaryConfig(): void {
    // console.log('cloudinaryConfig: ' + this.CLOUD_NAME + ' ' + this.CLOUD_API_KEY + ' ' + this.CLOUD_API_SECRET);
    cloudinary.v2.config({
      cloud_name: this.CLOUD_NAME,
      api_key: this.CLOUD_API_KEY,
      api_secret: this.CLOUD_API_SECRET
    });
  }
}

export const config: Config = new Config();
