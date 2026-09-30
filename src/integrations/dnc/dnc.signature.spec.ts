import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';
import { generateSignature } from './dnc.signature';

const envPath = resolve(__dirname, '../../../.env');
if (existsSync(envPath)) {
  loadEnv({ path: envPath, quiet: true });
}

describe('generateSignature', () => {
  it('tạo chữ ký và in ra', () => {
    const signature = generateSignature();
    console.log(signature);
    expect(signature.length).toBeGreaterThan(0);
  });
});
