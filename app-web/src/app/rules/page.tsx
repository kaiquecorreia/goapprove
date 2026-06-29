'use client';

import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { RulesTable } from '@/components/domain/RulesTable';
import { RuleBuilderSheet } from '@/components/domain/RuleBuilderSheet';
import { getRules } from '@/services/rules';
import styles from './styles.module.scss';

export default function RegrasPage() {
  const rules = getRules();

  return (
    <div className={styles.page}>
      <PageHeader
        title="Regras de Negócio"
        description="Regras de aprovação aplicadas automaticamente às OCs recebidas."
        actions={
          <RuleBuilderSheet trigger={<Button leftIcon={<Plus size={16} />}>Nova regra</Button>} />
        }
      />

      <Card>
        <CardContent>
          <RulesTable rules={rules} />
        </CardContent>
      </Card>
    </div>
  );
}
