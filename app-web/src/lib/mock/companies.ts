import type { Company } from './types';

export const mockCompanies: Company[] = [
  {
    id: 'comp-1',
    codeLN: 'BR010',
    name: 'Indústria Norte S.A.',
    cnpj: '12.345.678/0001-90',
    environment: 'Produção',
    url: 'https://mingle-sso.inforcloudsuite.com/BR010',
    status: 'Ativo',
  },
  {
    id: 'comp-2',
    codeLN: 'BR020',
    name: 'Logística Sul Ltda.',
    cnpj: '23.456.789/0001-01',
    environment: 'Produção',
    url: 'https://mingle-sso.inforcloudsuite.com/BR020',
    status: 'Ativo',
  },
  {
    id: 'comp-3',
    codeLN: 'BR030',
    name: 'Tech Centro S.A.',
    cnpj: '34.567.890/0001-12',
    environment: 'Homologação',
    url: 'https://mingle-sso.inforcloudsuite.com/BR030',
    status: 'Ativo',
  },
  {
    id: 'comp-4',
    codeLN: 'BR040',
    name: 'Comércio Leste Ltda.',
    cnpj: '45.678.901/0001-23',
    environment: 'Produção',
    url: 'https://mingle-sso.inforcloudsuite.com/BR040',
    status: 'Inativo',
    observations: 'Integração suspensa para revisão de contrato.',
  },
];
