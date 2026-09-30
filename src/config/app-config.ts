import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';
import { AppConfig, parseEnv } from './parse-env';

export const APP_CONFIG = Symbol('APP_CONFIG');

export function loadAppConfig(): AppConfig {
  const envPath = resolve(__dirname, '../../.env');
  if (existsSync(envPath)) {
    loadEnv({ path: envPath, quiet: true });
  }
  return parseEnv(process.env);
}
