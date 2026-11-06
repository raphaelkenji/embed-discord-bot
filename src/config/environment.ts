import { config } from 'dotenv';

config({ path: process.env.ENV_FILE || '.env', quiet: true });

function integer(name: string, fallback: number, min: number, max: number): number {
  const raw = process.env[name] ?? String(fallback);
  const value = Number(raw);
  if (!/^\d+$/.test(raw) || !Number.isSafeInteger(value) || value < min || value > max) {
    throw new Error(`${name} must be an integer between ${min} and ${max}`);
  }
  return value;
}

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

const ownerId = required('BOT_OWNER_ID');
if (!/^\d{17,20}$/.test(ownerId)) throw new Error('BOT_OWNER_ID must be a Discord user snowflake');

export const environment = {
  BOT_TOKEN: required('BOT_TOKEN'),
  BOT_OWNER_ID: ownerId,
  DB_USER: required('DB_USER'),
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_NAME: required('DB_NAME'),
  DB_PASS: required('DB_PASS'),
  DB_PORT: integer('DB_PORT', 5432, 1, 65535),
  REGEX_TIMEOUT_MS: integer('REGEX_TIMEOUT_MS', 500, 50, 5000),
  CACHE_TTL: integer('CACHE_TTL', 300, 1, 2147483),
  CACHE_CHECK_PERIOD: integer('CACHE_CHECK_PERIOD', 600, 1, 2147483),
} as const;
