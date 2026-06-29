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
import type { User, UserProfile } from '@/lib/mock/types';

const PROFILE_TONE: Record<UserProfile, BadgeVariant> = {
  Administrador: 'default',
  'Gestor de Regras': 'info',
  Aprovador: 'success',
  Consulta: 'secondary',
  'Integração LN': 'outline',
};

export function UsersTable({ users }: { users: User[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Usuário</TableHead>
          <TableHead>Perfil</TableHead>
          <TableHead>Empresa</TableHead>
          <TableHead align="right">Limite de aprovação</TableHead>
          <TableHead>Substituto</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
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
              <Badge variant={PROFILE_TONE[user.profile]}>{user.profile}</Badge>
            </TableCell>
            <TableCell>{user.company}</TableCell>
            <TableCell align="right">
              {user.approvalLimit > 0 ? formatCurrency(user.approvalLimit) : '—'}
            </TableCell>
            <TableCell>{user.substitute ?? '—'}</TableCell>
            <TableCell>
              <Badge variant={user.status === 'Ativo' ? 'success' : 'secondary'}>
                {user.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
