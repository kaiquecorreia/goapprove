'use client';

import { useMemo, useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge, BadgeVariant } from '@/components/ui/Badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { formatCurrency } from '@/lib/format/currency';
import { EUserRole } from '@/config/navigation';
import { USER_ROLE_LABELS } from '@/lib/userRoleLabels';
import { UserFormDialog } from '@/components/domain/UserFormDialog';
import type { Company, User } from '@/lib/mock/types';

const ROLE_TONE: Record<EUserRole, BadgeVariant> = {
  [EUserRole.OWNER]: 'default',
  [EUserRole.ADMINISTRATOR]: 'default',
  [EUserRole.RULES_MANAGER]: 'info',
  [EUserRole.APPROVER]: 'success',
  [EUserRole.VIEWER]: 'secondary',
  [EUserRole.EXTERNAL_INTEGRATION]: 'outline',
};

export function UsersTable({ users, companies }: { users: User[]; companies: Company[] }) {
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const companyNameById = useMemo(
    () => new Map(companies.map((company) => [company.companyId, company.name])),
    [companies],
  );
  const userNameById = useMemo(
    () => new Map(users.map((user) => [user.userId, user.name])),
    [users],
  );

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Usuário</TableHead>
            <TableHead>Perfil</TableHead>
            <TableHead>Empresas</TableHead>
            <TableHead align="right">Limite de aprovação</TableHead>
            <TableHead>Substitutos</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow
              key={user.userId}
              style={{ cursor: 'pointer' }}
              onClick={() => setEditingUser(user)}
            >
              <TableCell>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Avatar name={user.name} size="sm" />
                  <div>
                    <div>{user.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-tertiary)' }}>
                      {user.email}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={ROLE_TONE[user.role]}>{USER_ROLE_LABELS[user.role]}</Badge>
              </TableCell>
              <TableCell>
                {user.companies.length > 0
                  ? user.companies
                      .map((link) => companyNameById.get(link.companyId) ?? link.companyId)
                      .join(', ')
                  : '—'}
              </TableCell>
              <TableCell align="right">
                {user.approvalLimit && user.approvalLimit > 0
                  ? formatCurrency(user.approvalLimit)
                  : '—'}
              </TableCell>
              <TableCell>
                {user.substitutes.length > 0
                  ? user.substitutes
                      .map((link) => userNameById.get(link.substituteId) ?? link.substituteId)
                      .join(', ')
                  : '—'}
              </TableCell>
              <TableCell>
                <Badge variant={user.active ? 'success' : 'secondary'}>
                  {user.active ? 'Ativo' : 'Inativo'}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <UserFormDialog
        user={editingUser ?? undefined}
        companies={companies}
        users={users}
        open={!!editingUser}
        onOpenChange={(open) => {
          if (!open) setEditingUser(null);
        }}
      />
    </>
  );
}
