import { getFromBackend } from '@/lib/backendClient';
import type { User } from '@/lib/mock/types';

// Prisma serializes Decimal fields (approvalLimit) as strings over JSON.
type RawUser = Omit<User, 'approvalLimit'> & { approvalLimit: string | number | null };

export async function getUsers(): Promise<User[]> {
  const data = await getFromBackend<RawUser[]>('/user');
  return data.map((user) => ({
    ...user,
    approvalLimit: user.approvalLimit === null ? null : Number(user.approvalLimit),
  }));
}
