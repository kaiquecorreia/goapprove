import type { Company } from '@/lib/mock/types';

export interface CompanyPayload {
  externalIntegrationCode: string;
  name: string;
  environment: string;
  cnpj?: string;
  status?: boolean;
  externalIntegrationUrlBase?: string;
  notes?: string;
}

async function parseResponse(response: Response) {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = Array.isArray(data?.message) ? data.message.join('; ') : data?.message;
    throw new Error(message ?? 'Falha na requisição');
  }

  return data;
}

export async function createCompany(payload: CompanyPayload): Promise<Company> {
  const response = await fetch('/api/companies', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}

export async function updateCompany(
  companyId: string,
  payload: Partial<CompanyPayload>,
): Promise<Company> {
  const response = await fetch(`/api/companies/${companyId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}
