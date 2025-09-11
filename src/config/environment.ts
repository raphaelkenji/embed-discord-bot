import { config } from 'dotenv';

config();

export const environment = {
  BOT_TOKEN: process.env.BOT_TOKEN || '',
  
  DB_USER: process.env.DB_USER || '',
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_NAME: process.env.DB_NAME || '',
  DB_PASS: process.env.DB_PASS || '',
  DB_PORT: parseInt(process.env.DB_PORT || '5432'),
  
  CACHE_TTL: parseInt(process.env.CACHE_TTL || '300'),
  CACHE_CHECK_PERIOD: parseInt(process.env.CACHE_CHECK_PERIOD || '600'),
} as const;