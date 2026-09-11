import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { RulesTable } from '@/components/domain/RulesTable';
import { RuleBuilderSheet } from '@/components/domain/RuleBuilderSheet';
import { getRules } from '@/services/rules';
import { getCompanies } from '@/services/companies';
import { getUsers } from '@/services/users';
import styles from './styles.module.scss';

export default async function RegrasPage() {
  const [rules, companies, users] = await Promise.all([getRules(), getCompanies(), getUsers()]);

  return (
    <div className={styles.page}>
      <PageHeader
        title="Regras de Negócio"
        description="Regras de aprovação aplicadas automaticamente às OCs recebidas."
        actions={
          <RuleBuilderSheet
            trigger={<Button leftIcon={<Plus size={16} />}>Nova regra</Button>}
            companies={companies}
            users={users}
          />
        }
      />

      <Card>
        <CardContent>
          <RulesTable rules={rules} companies={companies} users={users} />
        </CardContent>
      </Card>
    </div>
  );
}
