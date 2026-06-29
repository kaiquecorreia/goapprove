import { mockCompanies } from './companies';
import { mockSuppliers } from './suppliers';
import type { ApprovalLevel, OCItem, OCStatus, PurchaseOrder, TimelineEvent } from './types';

const REQUESTERS = ['Bruno Henrique Lima', 'Carla Mendes', 'Gabriela Tavares', 'Eduarda Ribeiro'];
const CATEGORIES = ['Elétrico', 'TI', 'Logística', 'Matéria-prima'];
const COST_CENTERS = ['PROD', 'TI', 'MKT', 'LOG'];
const PROJECTS = ['Expansão Fábrica', 'Modernização TI', 'Reposição Estoque', 'Campanha Q2'];

function buildItems(seed: number): OCItem[] {
  return [
    {
      code: `CAB-${100 + seed}`,
      description: 'Cabo elétrico 2.5mm (rolo 100m)',
      qty: 4 + (seed % 5),
      unitPrice: 320.5,
      category: 'Elétrico',
    },
    {
      code: `CON-${200 + seed}`,
      description: 'Conector terminal industrial',
      qty: 20 + (seed % 10),
      unitPrice: 18.9,
      category: 'Elétrico',
    },
  ];
}

function buildWorkflow(status: OCStatus, level: number): ApprovalLevel[] {
  const levelOneStatus = status === 'rejected' && level === 1 ? 'rejected' : 'approved';
  const levelTwoStatus: ApprovalLevel['status'] =
    status === 'approved'
      ? 'approved'
      : status === 'rejected' && level >= 2
        ? 'rejected'
        : 'pending';

  return [
    {
      level: 1,
      mode: 'ANY',
      approvers: ['Bruno Henrique Lima', 'Carla Mendes'],
      sla: 4,
      status: level >= 1 ? levelOneStatus : 'pending',
    },
    {
      level: 2,
      mode: 'ALL',
      approvers: ['Ana Carolina Souza'],
      sla: 8,
      status: levelTwoStatus,
    },
  ];
}

function buildTimeline(status: OCStatus, receivedAt: string): TimelineEvent[] {
  const timeline: TimelineEvent[] = [
    { at: receivedAt, label: 'OC recebida do Infor LN', type: 'info' },
  ];

  if (status === 'no_rule') {
    timeline.push({ at: receivedAt, label: 'Nenhuma regra aplicável encontrada', type: 'warning' });
    return timeline;
  }

  if (status === 'error') {
    timeline.push({ at: receivedAt, label: 'Erro ao processar payload do LN', type: 'error' });
    return timeline;
  }

  timeline.push({ at: receivedAt, label: 'Regra de aprovação aplicada', type: 'info' });

  if (status === 'approved') {
    timeline.push({ at: receivedAt, label: 'Aprovada em todos os níveis', type: 'success' });
  } else if (status === 'rejected') {
    timeline.push({ at: receivedAt, label: 'Rejeitada por aprovador', type: 'error' });
  } else if (status === 'cancelled') {
    timeline.push({ at: receivedAt, label: 'Cancelada pelo solicitante', type: 'warning' });
  }

  return timeline;
}

function buildOC(index: number, status: OCStatus): PurchaseOrder {
  const day = ((index * 3) % 27) + 1;
  const month = ((index * 2) % 6) + 1;
  const company = mockCompanies[index % mockCompanies.length];
  const supplier = mockSuppliers[index % mockSuppliers.length];
  const requester = REQUESTERS[index % REQUESTERS.length];
  const total = 15000 + index * 4231.5;
  const receivedAt = `2026-0${month}-${String(day).padStart(2, '0')}T09:30:00`;
  const level = status === 'pending' ? 1 : 2;

  return {
    id: `oc-${status}-${index}`,
    number: `OC-2026-${String(1000 + index)}`,
    company: company.name,
    supplier: supplier.name,
    requester,
    buyer: 'Diego Pereira',
    total,
    project: PROJECTS[index % PROJECTS.length],
    costCenter: COST_CENTERS[index % COST_CENTERS.length],
    category: CATEGORIES[index % CATEGORIES.length],
    status,
    lnStatus: status === 'error' ? 'failed' : index % 3 === 0 ? 'pending_send' : 'synced',
    currentLevel: level,
    totalLevels: 2,
    receivedAt,
    slaHours: status === 'pending' ? 6 - (index % 9) : 0,
    items: buildItems(index),
    workflow: buildWorkflow(status, level),
    timeline: buildTimeline(status, receivedAt),
    appliedRule: status === 'no_rule' ? undefined : 'OC acima de R$ 100k — 2 níveis',
    comments:
      index % 4 === 0
        ? [
            {
              id: `comment-${index}`,
              author: requester,
              at: receivedAt,
              text: 'Favor priorizar essa OC, fornecedor com prazo curto de entrega.',
            },
          ]
        : [],
  };
}

export const mockPurchaseOrders: PurchaseOrder[] = [
  ...Array.from({ length: 10 }, (_, i) => buildOC(i, 'pending')),
  ...Array.from({ length: 6 }, (_, i) => buildOC(i + 10, 'approved')),
  ...Array.from({ length: 4 }, (_, i) => buildOC(i + 16, 'rejected')),
  ...Array.from({ length: 2 }, (_, i) => buildOC(i + 20, 'cancelled')),
  ...Array.from({ length: 2 }, (_, i) => buildOC(i + 22, 'no_rule')),
  ...Array.from({ length: 2 }, (_, i) => buildOC(i + 24, 'error')),
];
