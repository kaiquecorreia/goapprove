import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { CompaniesTable } from '@/components/domain/CompaniesTable';
import { CompanyFormDialog } from '@/components/domain/CompanyFormDialog';
import { getCompanies } from '@/services/companies';
import styles from './styles.module.scss';

export default async function EmpresasPage() {
  const companies = await getCompanies();

  return (
    <div className={styles.page}>
      <PageHeader
        title="Empresas"
        description="Empresas integradas ao ERP Infor LN."
        actions={
          <CompanyFormDialog
            trigger={<Button leftIcon={<Plus size={16} />}>Nova empresa</Button>}
          />
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
