import { requireSession } from '@/lib/apiAuth';
import { getCompanies } from '@/services/companies';
import { IntegrationsClient } from './IntegrationsClient';

export default async function IntegrationsPage() {
  const [companies, session] = await Promise.all([getCompanies(), requireSession()]);

  const sorted = [...companies].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  const defaultCompanyId =
    sorted.find((company) => company.companyId === session?.companyId)?.companyId ??
    sorted[0]?.companyId ??
    '';

  return (
    <IntegrationsClient
      companies={sorted.map(({ companyId, name, externalIntegrationCode }) => ({
        companyId,
        name,
        externalIntegrationCode,
      }))}
      defaultCompanyId={defaultCompanyId}
    />
  );
}
