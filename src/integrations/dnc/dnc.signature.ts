import { createSign } from 'node:crypto';
import { readFileSync } from 'node:fs';

export function generateSignature(): string {
  const clientId = process.env['CLIENT-ID'];
  const secretKey = process.env['SECRET-KEY'];
  const partnerCode = process.env['PARTNER-CODE'];
  const privateKeyPath = process.env.PRIVATE_KEY_PATH;

  if (!clientId || !secretKey || !partnerCode || !privateKeyPath) {
    throw new Error('Thiếu giá trị cần thiết để ký tạo chữ ký');
  }

  const privateKey = readFileSync(privateKeyPath, 'utf8');
  console.log('privateKey', privateKey);
  const data = `${clientId}|${secretKey}|${partnerCode}`;

  return createSign('RSA-SHA256')
    .update(data, 'utf8')
    .sign(privateKey, 'base64');
}
