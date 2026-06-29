'use client';

import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { CompaniesTable } from '@/components/domain/CompaniesTable';
import { getCompanies } from '@/services/companies';
import styles from './styles.module.scss';

export default function EmpresasPage() {
  const companies = getCompanies();

  return (
    <div className={styles.page}>
      <PageHeader
        title="Empresas"
        description="Empresas integradas ao ERP Infor LN."
        actions={
          <Button leftIcon={<Plus size={16} />} disabled>
            Nova empresa
          </Button>
        }
      />

      <Card>
        <CardContent>
          <CompaniesTable companies={companies} />
        </CardContent>
      </Card>
    </div>
  );
}
