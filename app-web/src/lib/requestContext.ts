import { AsyncLocalStorage } from 'async_hooks';
import { NextRequest } from 'next/server';

export interface OriginContext {
  ip: string | null;
  userAgent: string | null;
}

// Lets internalApiClient (services/api.ts) stamp every outgoing backend call
// with the real browser's IP/User-Agent, without threading them through every
// /api/** route handler. Without this, the backend only ever sees the Next.js
// server's own axios client as the caller.
const originContextStorage = new AsyncLocalStorage<OriginContext>();

export function resolveOriginContext(req: NextRequest): OriginContext {
  const forwardedFor = req.headers.get('x-forwarded-for');
  const ip = forwardedFor?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || null;

  return { ip, userAgent: req.headers.get('user-agent') };
}

export function runWithOriginContext<T>(context: OriginContext, fn: () => T): T {
  return originContextStorage.run(context, fn);
}

export function getOriginContext(): OriginContext | undefined {
  return originContextStorage.getStore();
}
