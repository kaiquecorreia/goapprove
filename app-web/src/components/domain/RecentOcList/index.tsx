import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar';
import { StatusBadge } from '@/components/domain/StatusBadge';
import { formatCurrency } from '@/lib/format/currency';
import type { PurchaseOrder } from '@/lib/mock/types';
import styles from './styles.module.scss';

export function RecentOcList({ orders }: { orders: PurchaseOrder[] }) {
  return (
    <div className={styles.list}>
      {orders.map((order) => (
        <Link key={order.id} href={`/ocs/${order.id}`} className={styles.item}>
          <Avatar name={order.requester} size="sm" />
          <div className={styles.body}>
            <span className={styles.number}>{order.number}</span>
            <span className={styles.meta}>
              {order.supplier} · {formatCurrency(order.total)}
            </span>
          </div>
          <StatusBadge status={order.status} />
        </Link>
      ))}
      {orders.length === 0 && <p className={styles.empty}>Nenhuma OC recente.</p>}
    </div>
  );
}
