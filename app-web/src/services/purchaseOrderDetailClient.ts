import type {
  ApprovalLevel,
  LNStatus,
  OCItem,
  OCStatus,
  PurchaseOrderDetail,
  TimelineEvent,
} from '@/lib/mock/types';

interface RawLine {
  itemCode: string;
  itemDescription: string;
  quantity: string | number;
  unitPrice: string | number;
  category: string | null;
}

interface RawApprover {
  sequenceOrder: number;
  status: string;
  user: { name: string };
}

interface RawLevel {
  level: number;
  mode: ApprovalLevel['mode'];
  status: string;
  approvers: RawApprover[];
}

interface RawAuditEvent {
  createdAt: string;
  message: string | null;
  severity: string;
  metadata: Record<string, unknown> | null;
}

interface RawWorkflowDetail {
  lnSyncStatus: 'NOT_APPLICABLE' | 'PENDING' | 'SYNCED' | 'FAILED';
  levels: RawLevel[];
  auditEvents: RawAuditEvent[];
  rule: { name: string; code: string } | null;
  purchaseOrder: {
    purchaseOrderId: string;
    orderNumber: string;
    supplierName: string | null;
    requesterName: string | null;
    buyerName: string | null;
    totalAmount: string | number;
    projectCode: string | null;
    costCenter: string | null;
    status: string;
    erpCreatedAt: string;
    company: { name: string };
    lines: RawLine[];
  };
}

const LN_SYNC_STATUS_MAP: Record<RawWorkflowDetail['lnSyncStatus'], LNStatus> = {
  NOT_APPLICABLE: 'not_applicable',
  PENDING: 'pending_send',
  SYNCED: 'synced',
  FAILED: 'failed',
};

function toItems(lines: RawLine[]): OCItem[] {
  return lines.map((line) => ({
    code: line.itemCode,
    description: line.itemDescription,
    qty: Number(line.quantity),
    unitPrice: Number(line.unitPrice),
    category: line.category ?? '—',
  }));
}

function toWorkflowLevels(levels: RawLevel[]): ApprovalLevel[] {
  return levels.map((level) => ({
    level: level.level,
    mode: level.mode,
    approvers: [...level.approvers]
      .sort((a, b) => a.sequenceOrder - b.sequenceOrder)
      .map((approver) => approver.user.name),
    status: level.status.toLowerCase() as ApprovalLevel['status'],
  }));
}

function formatEventDetail(metadata: Record<string, unknown> | null): string | undefined {
  if (!metadata) {
    return undefined;
  }

  const conflictedWith = metadata.conflictedWith;

  if (Array.isArray(conflictedWith) && conflictedWith.length > 0) {
    const names = conflictedWith
      .map((entry) =>
        typeof entry === 'object' && entry !== null && 'name' in entry
          ? String((entry as { name: unknown }).name)
          : null,
      )
      .filter((name): name is string => Boolean(name));

    if (names.length === conflictedWith.length) {
      return `Conflitou com: ${names.join(', ')}.`;
    }

    const count = conflictedWith.length;
    return count === 1 ? 'Conflitou com 1 outra regra.' : `Conflitou com ${count} outras regras.`;
  }

  const assignedUserName = metadata.assignedUserName;

  if (typeof assignedUserName === 'string' && assignedUserName.trim()) {
    return `Decisão registrada por ${assignedUserName}.`;
  }

  return undefined;
}

function toTimeline(auditEvents: RawAuditEvent[]): TimelineEvent[] {
  return auditEvents.map((event) => ({
    at: event.createdAt,
    label: event.message ?? '—',
    type: event.severity as TimelineEvent['type'],
    detail: formatEventDetail(event.metadata),
  }));
}

function toPurchaseOrderDetail(raw: RawWorkflowDetail): PurchaseOrderDetail {
  const po = raw.purchaseOrder;

  return {
    id: po.purchaseOrderId,
    number: po.orderNumber,
    company: po.company.name,
    supplier: po.supplierName ?? '—',
    requester: po.requesterName ?? '—',
    buyer: po.buyerName ?? '—',
    total: Number(po.totalAmount),
    project: po.projectCode ?? '—',
    costCenter: po.costCenter ?? '—',
    status: po.status.toLowerCase() as OCStatus,
    lnStatus: LN_SYNC_STATUS_MAP[raw.lnSyncStatus],
    receivedAt: po.erpCreatedAt,
    items: toItems(po.lines),
    workflow: toWorkflowLevels(raw.levels),
    timeline: toTimeline(raw.auditEvents),
    appliedRule: raw.rule?.name,
  };
}

export async function getPurchaseOrderDetail(id: string): Promise<PurchaseOrderDetail> {
  const response = await fetch(`/api/ocs/${id}`);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = Array.isArray(data?.message) ? data.message.join('; ') : data?.message;
    throw new Error(message ?? 'Falha ao carregar a OC');
  }

  return toPurchaseOrderDetail(data as RawWorkflowDetail);
}
