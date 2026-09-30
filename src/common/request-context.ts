import { AsyncLocalStorage } from 'node:async_hooks';

type RequestStore = {
  upstreamUrl?: string;
};

export const requestContext = new AsyncLocalStorage<RequestStore>();

export function rememberUpstreamUrl(url: string): void {
  const store = requestContext.getStore();
  if (store) {
    store.upstreamUrl = url;
  }
}
