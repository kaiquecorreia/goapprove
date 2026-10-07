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
