import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { UsersTable } from '@/components/domain/UsersTable';
import { UserFormDialog } from '@/components/domain/UserFormDialog';
import { getUsers } from '@/services/users';
import { getCompanies } from '@/services/companies';
import styles from './styles.module.scss';

export default async function UsuariosPage() {
  const [users, companies] = await Promise.all([getUsers(), getCompanies()]);

  return (
    <div className={styles.page}>
      <PageHeader
        title="Usuários"
        description="Usuários com acesso ao fluxo de aprovação de OCs."
        actions={
          <UserFormDialog
            companies={companies}
            users={users}
            trigger={<Button leftIcon={<Plus size={16} />}>Novo usuário</Button>}
          />
        }
      />

      <Card>
        <CardContent>
          <UsersTable users={users} companies={companies} />
        </CardContent>
      </Card>
    </div>
  );
}
