import { PendingOcsBoard } from '@/components/domain/PendingOcsBoard';
import { getCompanies } from '@/services/companies';

export default async function OcsPendentesPage() {
  const companies = await getCompanies();

  return <PendingOcsBoard companies={companies} />;
}
