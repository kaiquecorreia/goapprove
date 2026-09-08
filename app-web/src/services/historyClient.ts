import type { OCStatus, PendingPurchaseOrder, PendingPurchaseOrdersPage } from '@/lib/mock/types';

export interface HistoryPurchaseOrdersFilters {
  page: number;
  limit: number;
  search?: string;
  status?: OCStatus;
  companyId?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface RawHistoryWorkflow {
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

interface RawHistoryResponse {
  items: RawHistoryWorkflow[];
  total: number;
  page: number;
  limit: number;
}

function toHistoryPurchaseOrder(workflow: RawHistoryWorkflow): PendingPurchaseOrder {
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

export async function getHistoryPurchaseOrders(
  filters: HistoryPurchaseOrdersFilters,
): Promise<PendingPurchaseOrdersPage> {
  const params = new URLSearchParams({
    page: String(filters.page),
    limit: String(filters.limit),
  });
  if (filters.search) params.set('search', filters.search);
  if (filters.status) params.set('status', filters.status.toUpperCase());
  if (filters.companyId) params.set('companyId', filters.companyId);
  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
  if (filters.dateTo) params.set('dateTo', filters.dateTo);

  const response = await fetch(`/api/ocs/history?${params.toString()}`);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = Array.isArray(data?.message) ? data.message.join('; ') : data?.message;
    throw new Error(message ?? 'Falha ao carregar histórico de OCs');
  }

  const raw = data as RawHistoryResponse;

  return {
    items: raw.items.map(toHistoryPurchaseOrder),
    total: raw.total,
    page: raw.page,
    limit: raw.limit,
  };
}
