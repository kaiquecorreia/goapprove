'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { CompanyFormDialog } from '@/components/domain/CompanyFormDialog';
import { COMPANY_ENVIRONMENT_LABELS } from '@/app/companies/schema';
import type { Company } from '@/lib/mock/types';

export function CompaniesTable({ companies }: { companies: Company[] }) {
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Código de integração</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>CNPJ</TableHead>
            <TableHead>Ambiente</TableHead>
            <TableHead>URL de integração</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {companies.map((company) => (
            <TableRow
              key={company.companyId}
              style={{ cursor: 'pointer' }}
              onClick={() => setEditingCompany(company)}
            >
              <TableCell>{company.externalIntegrationCode}</TableCell>
              <TableCell>{company.name}</TableCell>
              <TableCell>{company.cnpj ?? '—'}</TableCell>
              <TableCell>
                <Badge variant={company.environment === 'PRODUCTION' ? 'info' : 'secondary'}>
                  {COMPANY_ENVIRONMENT_LABELS[company.environment]}
                </Badge>
              </TableCell>
              <TableCell>{company.externalIntegrationUrlBase ?? '—'}</TableCell>
              <TableCell>
                <Badge variant={company.status ? 'success' : 'secondary'}>
                  {company.status ? 'Ativo' : 'Inativo'}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <CompanyFormDialog
        company={editingCompany ?? undefined}
        open={!!editingCompany}
        onOpenChange={(open) => {
          if (!open) setEditingCompany(null);
        }}
      />
    </>
  );
}
