'use client';

import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { UsersTable } from '@/components/domain/UsersTable';
import { UserFormDialog } from '@/components/domain/UserFormDialog';
import { getUsers } from '@/services/users';
import styles from './styles.module.scss';

export default function UsuariosPage() {
  const users = getUsers();

  return (
    <div className={styles.page}>
      <PageHeader
        title="Usuários"
        description="Usuários com acesso ao fluxo de aprovação de OCs."
        actions={
          <UserFormDialog trigger={<Button leftIcon={<Plus size={16} />}>Novo usuário</Button>} />
        }
      />

      <Card>
        <CardContent>
          <UsersTable users={users} />
        </CardContent>
      </Card>
    </div>
  );
}
