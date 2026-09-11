import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { RefreshablePage } from '@/components/ui/RefreshablePage';
import { Card, CardContent } from '@/components/ui/Card';
import { CompaniesTable } from '@/components/domain/CompaniesTable';
import { CompanyFormDialog } from '@/components/domain/CompanyFormDialog';
import { getCompanies } from '@/services/companies';
import { requireSession } from '@/lib/apiAuth';
import { EUserRole } from '@/config/navigation';
import styles from './styles.module.scss';

export default async function EmpresasPage() {
  const [companies, session] = await Promise.all([getCompanies(), requireSession()]);
  const isAdministrator = session?.role === EUserRole.ADMINISTRATOR;

  return (
    <div className={styles.page}>
      <RefreshablePage
        title="Empresas"
        description="Empresas integradas ao ERP Infor LN."
        extraActions={
          isAdministrator && (
            <CompanyFormDialog
              trigger={<Button leftIcon={<Plus size={16} />}>Nova empresa</Button>}
            />
          )
        }
      >
        <Card>
          <CardContent>
            <CompaniesTable companies={companies} />
          </CardContent>
        </Card>
      </RefreshablePage>
    </div>
  );
}
