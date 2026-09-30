import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { requestContext } from '../request-context';

@Injectable()
export class RequestLogMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const started = Date.now();
    let responseBody: unknown;
    const store: { upstreamUrl?: string } = {};

    const originalJson = res.json.bind(res);
    res.json = ((body?: unknown): Response => {
      responseBody = body;
      originalJson(body);
      return res;
    }) as Response['json'];

    const originalSend = res.send.bind(res);
    res.send = ((body?: unknown): Response => {
      responseBody = body;
      originalSend(body);
      return res;
    }) as Response['send'];

    res.on('finish', () => {
      const detail = {
        url: currentUrl(req),
        upstreamUrl: store.upstreamUrl ?? null,
        response: describeResponse(responseBody, res),
      };
      const line = `${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - started}ms)\n${JSON.stringify(detail, null, 2)}`;
      if (res.statusCode >= 500) {
        this.logger.error(line);
      } else if (res.statusCode >= 400) {
        this.logger.warn(line);
      } else {
        this.logger.log(line);
      }
    });

    requestContext.run(store, () => next());
  }
}

function currentUrl(req: Request): string {
  return `${req.protocol}://${req.get('host')}${req.originalUrl}`;
}

function describeResponse(body: unknown, res: Response): unknown {
  const type = String(res.getHeader('content-type') ?? '');
  if (
    Buffer.isBuffer(body) ||
    type.includes('application/zip') ||
    type.includes('octet-stream')
  ) {
    return {
      binary: true,
      bytes: Buffer.isBuffer(body) ? body.length : undefined,
    };
  }

  if (typeof body === 'string') {
    try {
      return JSON.parse(body) as unknown;
    } catch {
      return body;
    }
  }

  return body;
}
