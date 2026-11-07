import { config as loadDotenv } from 'dotenv';
import path from 'node:path';

loadDotenv({ path: path.resolve(__dirname, '../../.env'), quiet: true });

export interface Env {
  readonly baseUrl: string;
  readonly username: string;
  readonly password: string;
}

const DEMO_DEFAULTS: Env = {
  baseUrl: 'https://opensource-demo.orangehrmlive.com',
  username: 'Admin',
  password: 'admin123',
};

function read(name: string, fallback: string): string {
  const value = process.env[name]?.trim();
  return value ? value : fallback;
}

export const env: Env = {
  baseUrl: read('BASE_URL', DEMO_DEFAULTS.baseUrl).replace(/\/+$/, ''),
  username: read('ORANGEHRM_USERNAME', DEMO_DEFAULTS.username),
  password: read('ORANGEHRM_PASSWORD', DEMO_DEFAULTS.password),
};
