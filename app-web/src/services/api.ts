import axios from 'axios';

import { getOriginContext } from '@/lib/requestContext';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

export const internalApiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'x-internal-api-key': process.env.INTERNAL_API_KEY,
  },
});

// Stamps every call with the real browser's IP/User-Agent (set by
// withAuthenticatedRoute via AsyncLocalStorage) instead of axios's own
// defaults — otherwise every web-triggered audit event records the Next.js
// server itself as the actor's origin.
internalApiClient.interceptors.request.use((config) => {
  const origin = getOriginContext();

  if (origin?.ip) {
    config.headers['x-forwarded-for'] = origin.ip;
  }
  if (origin?.userAgent) {
    config.headers['user-agent'] = origin.userAgent;
  }

  return config;
});
