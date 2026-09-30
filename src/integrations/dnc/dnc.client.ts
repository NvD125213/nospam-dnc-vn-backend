import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { rememberUpstreamUrl } from '../../common/request-context';
import type { DncConnectionConfig } from '../../config/parse-env';
import { DNC_CONNECTION, DNC_FETCH } from './dnc.constants';
import type { DncFetch } from './dnc.constants';
import { formatDncDateTime } from './dnc.datetime';
import { DncConfigError, DncTransportError } from './dnc.errors';
import type { DncEnvelope, DncFile, DncJson, DncRequest } from './dnc.types';

/**
 * Client gọi ra hệ thống DNC VNCert (v1.0.0).
 * Feature module inject class này và truyền path tương đối.
 * Header bắt buộc nằm trong module này. Body response trả nguyên
 * như API_URL gửi về. Chữ ký body lấy từ SIGNATURE trong env.
 */
@Injectable()
export class DncClient implements OnModuleInit {
  private readonly logger = new Logger(DncClient.name);

  constructor(
    @Inject(DNC_CONNECTION) private readonly connection: DncConnectionConfig,
    @Inject(DNC_FETCH) private readonly fetchImpl: DncFetch,
  ) {}

  onModuleInit(): void {
    this.logger.log(
      `môi trường=${this.connection.environment} baseUrl=${this.connection.baseUrl}`,
    );
  }

  formatDateTime(date: Date): string {
    return formatDncDateTime(date);
  }

  get signature(): string {
    return this.connection.signature;
  }

  async request<T = DncEnvelope>(input: DncRequest): Promise<T> {
    const url = this.buildUrl(input);
    rememberUpstreamUrl(url);
    const response = await this.send(input);
    const rawBody = await response.text();
    return describeRaw(rawBody) as T;
  }

  async download(input: DncRequest): Promise<DncFile | DncJson> {
    const url = this.buildUrl(input);
    rememberUpstreamUrl(url);
    const response = await this.send(input);
    const bytes = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get('content-type') ?? '';
    if (
      contentType.includes('application/json') ||
      contentType.includes('text/json') ||
      isJsonBytes(bytes)
    ) {
      return describeRaw(bytes.toString('utf8'));
    }
    return {
      data: bytes,
      contentType: contentType || 'application/zip',
      fileName: fileNameFrom(response),
    };
  }

  private async send(input: DncRequest): Promise<Response> {
    if (input.body !== undefined && input.form) {
      throw new DncConfigError(
        'Chỉ gửi JSON hoặc form data, không gửi cả hai.',
      );
    }

    const init: RequestInit = {
      method: input.method,
      headers: this.headers(input),
      signal: AbortSignal.timeout(this.connection.timeoutMs),
    };

    if (input.form) {
      init.body = input.form;
    } else if (input.body !== undefined) {
      init.body = JSON.stringify(input.body);
    }

    try {
      return await this.fetchImpl(this.buildUrl(input), init);
    } catch (error) {
      if (error instanceof DncConfigError) {
        throw error;
      }
      throw new DncTransportError(
        `Kết nối hệ thống thất bại: ${input.method} ${input.path}`,
        { cause: error },
      );
    }
  }

  private headers(input: DncRequest): Record<string, string> {
    const headers: Record<string, string> = {
      'dnc-client-id': this.connection.clientId,
      'dnc-secret-key': this.connection.secretKey,
      'dnc-partner-code': this.connection.partnerCode,
    };

    if (input.body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    return headers;
  }

  private buildUrl(input: DncRequest): string {
    if (/^https?:\/\//i.test(input.path) || input.path.includes('..')) {
      throw new DncConfigError('Đường dẫn không hợp lệ');
    }

    const base = this.connection.baseUrl.endsWith('/')
      ? this.connection.baseUrl
      : `${this.connection.baseUrl}/`;
    const url = new URL(input.path.replace(/^\//, ''), base);

    if (!url.href.startsWith(base)) {
      throw new DncConfigError('Đường dẫn không hợp lệ');
    }

    if (input.query) {
      for (const [key, value] of Object.entries(input.query)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    return url.href;
  }
}

export function isDncFile(value: unknown): value is DncFile {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const file = value as DncFile;
  return (
    Buffer.isBuffer(file.data) &&
    typeof file.contentType === 'string' &&
    typeof file.fileName === 'string'
  );
}

function describeRaw(text: string | undefined): DncJson {
  if (text === undefined) {
    return null;
  }
  if (text === '') {
    return '';
  }
  try {
    return JSON.parse(text) as DncJson;
  } catch {
    return text;
  }
}

function isJsonBytes(bytes: Buffer): boolean {
  const start = bytes.toString('utf8').trimStart();
  return start.startsWith('{') || start.startsWith('[');
}

function fileNameFrom(response: Response): string {
  const header = response.headers.get('content-disposition') ?? '';
  const match = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(header);
  const raw = decodeURIComponent(match?.[1] ?? match?.[2] ?? 'inventory.zip');
  const fileName = raw.replace(/["\r\n]/g, '').trim();
  return fileName || 'inventory.zip';
}
