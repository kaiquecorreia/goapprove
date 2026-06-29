import { mockUsers } from '@/lib/mock';
import type { User } from '@/lib/mock/types';

export function getUsers(): User[] {
  return mockUsers;
}
