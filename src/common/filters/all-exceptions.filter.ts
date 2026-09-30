import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { formatDncDateTime } from '../../integrations/dnc/dnc.datetime';
import {
  DncConfigError,
  DncRejectedError,
  DncTransportError,
} from '../../integrations/dnc/dnc.errors';

type ErrorBody = {
  code: number;
  status: string;
  timestamp: string;
  msg_error: string[];
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const mapped = mapException(exception);

    if (mapped.code >= 500) {
      const message =
        exception instanceof Error ? exception.message : 'Unhandled error';
      this.logger.error(message);
    }

    response.status(mapped.code).json(mapped);
  }
}

function mapException(exception: unknown): ErrorBody {
  if (exception instanceof DncRejectedError) {
    const code = httpCode(exception.code, 400);
    return errorBody(
      code,
      exception.status || reason(code),
      exception.errorCodes.length > 0
        ? exception.errorCodes
        : [exception.message],
    );
  }

  if (exception instanceof DncTransportError) {
    return errorBody(502, reason(502), [exception.message]);
  }

  if (exception instanceof DncConfigError) {
    return errorBody(500, reason(500), [exception.message]);
  }

  if (exception instanceof HttpException) {
    const payload = exception.getResponse();
    const code = exception.getStatus();
    return errorBody(code, statusText(payload, code), messagesFrom(payload));
  }

  return errorBody(500, reason(500), ['Internal server error']);
}

function errorBody(
  code: number,
  status: string,
  msgError: string[],
): ErrorBody {
  return {
    code,
    status,
    timestamp: formatDncDateTime(new Date()),
    msg_error: msgError.length > 0 ? msgError : [reason(code)],
  };
}

function httpCode(code: number, fallback: number): number {
  if (Number.isInteger(code) && code >= 400 && code <= 599) {
    return code;
  }
  return fallback;
}

function messagesFrom(payload: unknown): string[] {
  if (typeof payload === 'string' && payload.trim()) {
    return [payload];
  }
  if (Array.isArray(payload)) {
    const items = payload
      .map((item) => String(item))
      .filter((item) => item.trim());
    return items;
  }
  if (typeof payload === 'object' && payload !== null) {
    const record = payload as Record<string, unknown>;
    if (record.message !== undefined) {
      return messagesFrom(record.message);
    }
    if (record.msg_error !== undefined) {
      return messagesFrom(record.msg_error);
    }
  }
  return [];
}

function statusText(payload: unknown, code: number): string {
  if (typeof payload === 'object' && payload !== null) {
    const error = (payload as Record<string, unknown>).error;
    if (typeof error === 'string' && error.trim()) {
      return error;
    }
  }
  return reason(code);
}

function reason(code: number): string {
  switch (code) {
    case 400:
      return 'Bad Request';
    case 401:
      return 'Unauthorized';
    case 403:
      return 'Forbidden';
    case 404:
      return 'Not Found';
    case 409:
      return 'Conflict';
    case 422:
      return 'Unprocessable Entity';
    case 500:
      return 'Internal Server Error';
    case 502:
      return 'Bad Gateway';
    default:
      return code >= 500 ? 'Internal Server Error' : 'Bad Request';
  }
}
