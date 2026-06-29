import type { PurchaseOrder } from '@/lib/mock/types';
import styles from './styles.module.scss';

export function OcPayloadViewer({ order }: { order: PurchaseOrder }) {
  const payload = {
    number: order.number,
    company: order.company,
    supplier: order.supplier,
    total: order.total,
    items: order.items,
    lnStatus: order.lnStatus,
    receivedAt: order.receivedAt,
  };

  return <pre className={styles.pre}>{JSON.stringify(payload, null, 2)}</pre>;
}
