import type { SelectOption } from '@/components/ui/Select';

export const mockWarehouses: SelectOption[] = [
  { value: 'ARM-01', label: 'ARM-01 – Central São Paulo' },
  { value: 'ARM-02', label: 'ARM-02 – Campinas' },
  { value: 'ARM-03', label: 'ARM-03 – Curitiba' },
  { value: 'ARM-04', label: 'ARM-04 – Recife' },
];

export const mockQuoteCompanies: SelectOption[] = [
  { value: '100', label: '100 – GoApprove Indústria S.A.' },
  { value: '200', label: '200 – GoApprove Comércio LTDA' },
  { value: '300', label: '300 – GoApprove Serviços LTDA' },
];

export interface QuoteSupplier {
  id: string;
  name: string;
  cnpj: string;
  email: string;
  phone: string;
}

export const mockQuoteSuppliers: QuoteSupplier[] = [
  {
    id: 'sup-1',
    name: 'Aço Forte Distribuidora LTDA',
    cnpj: '12.345.678/0001-90',
    email: 'cotacoes@acoforte.com.br',
    phone: '(11) 3456-7890',
  },
  {
    id: 'sup-2',
    name: 'Embalagens Paulista S.A.',
    cnpj: '23.456.789/0001-01',
    email: 'vendas@embpaulista.com.br',
    phone: '(19) 3222-1100',
  },
  {
    id: 'sup-3',
    name: 'Química Sul Insumos LTDA',
    cnpj: '34.567.890/0001-12',
    email: 'comercial@quimicasul.com.br',
    phone: '',
  },
];
