import type { OCStatus, PendingPurchaseOrder, PendingPurchaseOrdersPage } from '@/lib/mock/types';

export interface PendingPurchaseOrdersFilters {
  page: number;
  limit: number;
  search?: string;
  companyId?: string;
  supplierCode?: string;
  requesterCode?: string;
  costCenter?: string;
}

interface RawPendingWorkflow {
  currentLevel: number | null;
  levels: unknown[];
  purchaseOrder: {
    purchaseOrderId: string;
    orderNumber: string;
    supplierName: string | null;
    requesterName: string | null;
    totalAmount: string | number;
    costCenter: string | null;
    status: string;
    erpCreatedAt: string;
    company: { name: string };
  };
}

interface RawPendingWorkflowsResponse {
  items: RawPendingWorkflow[];
  total: number;
  page: number;
  limit: number;
}

function toPendingPurchaseOrder(workflow: RawPendingWorkflow): PendingPurchaseOrder {
  const po = workflow.purchaseOrder;

  return {
    id: po.purchaseOrderId,
    number: po.orderNumber,
    company: po.company.name,
    supplier: po.supplierName ?? '—',
    requester: po.requesterName ?? '—',
    total: Number(po.totalAmount),
    status: po.status.toLowerCase() as OCStatus,
    currentLevel: workflow.currentLevel,
    totalLevels: workflow.levels.length,
    costCenter: po.costCenter,
    erpCreatedAt: po.erpCreatedAt,
  };
}

export async function getPendingPurchaseOrders(
  filters: PendingPurchaseOrdersFilters,
): Promise<PendingPurchaseOrdersPage> {
  const params = new URLSearchParams({
    page: String(filters.page),
    limit: String(filters.limit),
  });
  if (filters.search) params.set('search', filters.search);
  if (filters.companyId) params.set('companyId', filters.companyId);
  if (filters.supplierCode) params.set('supplierCode', filters.supplierCode);
  if (filters.requesterCode) params.set('requesterCode', filters.requesterCode);
  if (filters.costCenter) params.set('costCenter', filters.costCenter);

  const response = await fetch(`/api/ocs/pending?${params.toString()}`);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = Array.isArray(data?.message) ? data.message.join('; ') : data?.message;
    throw new Error(message ?? 'Falha ao carregar OCs pendentes');
  }

  const raw = data as RawPendingWorkflowsResponse;

  return {
    items: raw.items.map(toPendingPurchaseOrder),
    total: raw.total,
    page: raw.page,
    limit: raw.limit,
  };
}
