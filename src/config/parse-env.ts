export type DncEnvironment = 'live' | 'sandbox';

export type DncConnectionConfig = {
  environment: DncEnvironment;
  baseUrl: string;
  clientId: string;
  secretKey: string;
  partnerCode: string;
  signature: string;
  timeoutMs: number;
};

export type AppConfig = {
  nodeEnv: string;
  port: number;
  dnc: DncConnectionConfig;
};

function readString(
  env: Record<string, unknown>,
  keys: string[],
): string | undefined {
  for (const key of keys) {
    const value = env[key];
    if (typeof value === 'string' && value.trim() !== '') {
      return value.trim();
    }
  }
  return undefined;
}

export function parseEnv(env: Record<string, unknown>): AppConfig {
  const missing: string[] = [];
  const nodeEnv = readString(env, ['NODE_ENV']) ?? 'development';

  const portRaw = readString(env, ['PORT']);
  const port = portRaw === undefined ? 3000 : Number(portRaw);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT phải là số nguyên từ 1 đến 65535');
  }

  const environmentRaw = (
    readString(env, ['DNC_ENVIRONMENT']) ?? 'live'
  ).toLowerCase();
  if (environmentRaw !== 'live' && environmentRaw !== 'sandbox') {
    throw new Error('DNC_ENVIRONMENT phải là live hoặc sandbox');
  }

  const baseUrl = readString(env, ['API_URL']);
  const clientId = readString(env, ['CLIENT-ID']);
  const secretKey = readString(env, ['SECRET-KEY']);
  const partnerCode = readString(env, ['PARTNER-CODE']);
  const signature = readString(env, ['SIGNATURE']);

  if (!baseUrl) missing.push('Chưa có cấu hình API_URL');
  if (!clientId) missing.push('Chưa có cấu hình thông tin mã người dùng');
  if (!secretKey) missing.push('Chưa có cấu hình thông tin mã bí mật');
  if (!partnerCode) missing.push('Chưa có cấu hình thông tin mã đối tác');
  if (!signature) missing.push('Chưa có cấu hình chữ ký');
  if (
    missing.length > 0 ||
    !baseUrl ||
    !clientId ||
    !secretKey ||
    !partnerCode ||
    !signature
  ) {
    console.error(
      `Chưa có cấu hình thông tin môi trường: ${missing.join(', ')}`,
    );
    throw new Error('Chưa có cấu hình thông tin môi trường');
  }

  const timeoutRaw = readString(env, ['DNC_TIMEOUT_MS']);
  const timeoutMs = timeoutRaw === undefined ? 15_000 : Number(timeoutRaw);
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new Error('Thời gian chờ không hợp lệ');
  }

  return {
    nodeEnv,
    port,
    dnc: {
      environment: environmentRaw,
      baseUrl: baseUrl.replace(/\/+$/, ''),
      clientId,
      secretKey,
      partnerCode,
      signature,
      timeoutMs,
    },
  };
}
