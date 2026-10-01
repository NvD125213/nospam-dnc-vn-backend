import { Injectable, Logger, NestMiddleware } from '@nestjs/common';

import type { NextFunction, Request, Response } from 'express';

import { randomUUID } from 'crypto';
import { requestContext } from '../request-context';

type RequestStore = {
  requestId: string;
  upstreamUrl?: string;
};

@Injectable()
export class RequestLogMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const started = Date.now();

    const requestId = req.headers['x-request-id']?.toString() ?? randomUUID();

    const store: RequestStore = {
      requestId,
    };

    // Trả requestId về client để dễ đối soát
    res.setHeader('x-request-id', requestId);

    let responseBody: unknown;

    // Capture response body
    const originalJson = res.json.bind(res);

    res.json = ((body?: unknown): unknown => {
      responseBody = body;
      return originalJson(body);
    }) as Response['json'];

    const originalSend = res.send.bind(res);

    res.send = ((body?: unknown): unknown => {
      responseBody = body;
      return originalSend(body);
    }) as Response['send'];

    res.on('finish', () => {
      const durationMs = Date.now() - started;

      const logData = {
        requestId,
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs,

        client: {
          ip: getClientIp(req),
          userAgent: req.get('user-agent') ?? null,
        },

        upstreamUrl: store.upstreamUrl ?? null,

        response: describeResponse(responseBody, res),
      };

      const message = JSON.stringify(logData);

      if (res.statusCode >= 500) {
        this.logger.error(message);
      } else if (res.statusCode >= 400) {
        this.logger.warn(message);
      } else {
        this.logger.log(message);
      }
    });

    requestContext.run(store, () => {
      next();
    });
  }
}

function getClientIp(req: Request): string | null {
  const forwarded = req.headers['x-forwarded-for'];

  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0]?.trim() ?? null;
  }

  return req.ip ?? null;
}

function describeResponse(body: unknown, res: Response): unknown {
  const contentType = String(res.getHeader('content-type') ?? '');

  // File / binary response
  if (
    Buffer.isBuffer(body) ||
    contentType.includes('application/zip') ||
    contentType.includes('application/octet-stream') ||
    contentType.includes('application/pdf') ||
    contentType.startsWith('image/')
  ) {
    return {
      type: 'binary',
      contentType,
      bytes: Buffer.isBuffer(body) ? body.length : undefined,
    };
  }

  // Không có response body
  if (body === undefined || body === null) {
    return {
      type: 'empty',
    };
  }

  // JSON object
  if (typeof body === 'object') {
    return {
      type: 'json',
      data: sanitizeResponse(body),
    };
  }

  // String response
  if (typeof body === 'string') {
    try {
      const parsed: unknown = JSON.parse(body);

      return {
        type: 'json',
        data: sanitizeResponse(parsed),
      };
    } catch {
      return {
        type: 'text',
        length: body.length,
      };
    }
  }

  return {
    type: typeof body,
  };
}

function sanitizeResponse(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.slice(0, 10).map(sanitizeResponse);
  }

  if (value === null || typeof value !== 'object') {
    return value;
  }

  const result: Record<string, unknown> = {};

  for (const [key, val] of Object.entries(value)) {
    const normalizedKey = key.toLowerCase();

    // Không log thông tin nhạy cảm
    if (
      normalizedKey.includes('authorization') ||
      normalizedKey.includes('password') ||
      normalizedKey.includes('secret') ||
      normalizedKey.includes('signature') ||
      normalizedKey.includes('privatekey') ||
      normalizedKey.includes('token')
    ) {
      result[key] = '[REDACTED]';
      continue;
    }

    // Mask số điện thoại
    if (
      normalizedKey === 'cusphone' ||
      normalizedKey === 'phone' ||
      normalizedKey === 'phonenumber'
    ) {
      result[key] = maskPhone(val);
      continue;
    }

    result[key] = sanitizeResponse(val);
  }

  return result;
}

function maskPhone(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  if (value.length <= 4) {
    return '****';
  }

  return `${value.slice(0, 4)}****${value.slice(-2)}`;
}
