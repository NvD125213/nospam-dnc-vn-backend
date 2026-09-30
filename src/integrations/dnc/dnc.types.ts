export type DncMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type DncRequest = {
  method: DncMethod;
  path: string;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  form?: FormData;
};

export type DncEnvelope = {
  code: number;
  status: string;
  timestamp?: string;
  msg_success?: string;
  msg_error?: string[];
};

export type DncFile = {
  data: Buffer;
  contentType: string;
  fileName: string;
};

export type DncJson =
  string | number | boolean | null | DncJson[] | { [key: string]: DncJson };
