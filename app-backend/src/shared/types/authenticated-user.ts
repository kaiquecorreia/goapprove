import { UserRole } from '@prisma/client';

export interface AuthenticatedUser {
  userId: string;
  role: UserRole;
  email: string;
  // Snapshotted onto audit events so a deleted user still leaves a named actor.
  name?: string;
  companyId?: string;
}
