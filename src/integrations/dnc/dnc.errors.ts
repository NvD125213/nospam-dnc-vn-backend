export class DncConfigError extends Error {
  readonly name = 'ConfigError';

  constructor(message: string) {
    super(message);
  }
}

export class DncRejectedError extends Error {
  readonly name = 'RejectedError';

  constructor(
    readonly code: number,
    readonly status: string,
    readonly errorCodes: string[],
  ) {
    super(
      errorCodes.length > 0
        ? errorCodes.join(', ')
        : `Rejected the call (${code} ${status})`,
    );
  }
}

export class DncTransportError extends Error {
  readonly name = 'TransportError';

  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
  }
}
