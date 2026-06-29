'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronsLeft, ChevronsRight } from 'lucide-react';
import { navigationGroups } from '@/config/navigation';
import { getPurchaseOrders } from '@/services/purchaseOrders';
import { cx } from '@/lib/cx';
import Logo from '@/components/Logo';
import styles from './styles.module.scss';

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const pathname = usePathname();
  const pendingCount = getPurchaseOrders().filter((order) => order.status === 'pending').length;

  return (
    <aside className={cx(styles.sidebar, collapsed && styles.collapsed)}>
      <div className={styles.brand}>
        {!collapsed && <Logo height={28} />}
        <button
          type="button"
          className={styles.toggleButton}
          onClick={onToggle}
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
        </button>
      </div>

      <nav className={styles.nav}>
        {navigationGroups.map((group) => (
          <div key={group.label} className={styles.group}>
            {!collapsed && <span className={styles.groupLabel}>{group.label}</span>}
            <ul className={styles.items}>
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                const badge = item.href === '/ocs/pending' ? pendingCount : undefined;
                const Icon = item.icon;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cx(styles.link, isActive && styles.active)}
                      title={collapsed ? item.name : undefined}
                    >
                      <Icon size={18} />
                      {!collapsed && <span className={styles.linkLabel}>{item.name}</span>}
                      {!collapsed && badge ? <span className={styles.badge}>{badge}</span> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
