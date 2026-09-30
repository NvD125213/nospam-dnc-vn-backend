export const DNC_CONNECTION = Symbol('DNC_CONNECTION');

export type DncFetch = (url: string, init: RequestInit) => Promise<Response>;

export const DNC_FETCH = Symbol('DNC_FETCH');
