import type { User } from '@/lib/mock/types';

export interface UserPayload {
  name: string;
  email: string;
  externalIntegrationUser: string;
  role: string;
  active?: boolean;
  approvalLimit?: number | null;
  companyIds?: string[];
  substituteIds?: string[];
}

async function parseResponse(response: Response) {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = Array.isArray(data?.message) ? data.message.join('; ') : data?.message;
    throw new Error(message ?? 'Falha na requisição');
  }

  return data;
}

export async function createUser(payload: UserPayload): Promise<User> {
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}

export async function updateUser(userId: string, payload: Partial<UserPayload>): Promise<User> {
  const response = await fetch(`/api/users/${userId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}
