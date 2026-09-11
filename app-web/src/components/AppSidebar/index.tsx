'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ChevronsLeft, ChevronsRight } from 'lucide-react';
import { EUserRole, navigationGroups } from '@/config/navigation';
import { cx } from '@/lib/cx';
import Logo from '@/components/Logo';
import { APP_VERSION } from '@/lib/version';
import styles from './styles.module.scss';

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.role as EUserRole | undefined;

  const visibleGroups = navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => role && item.allowedRoles.includes(role)),
    }))
    .filter((group) => group.items.length > 0);

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
        {visibleGroups.map((group) => (
          <div key={group.label} className={styles.group}>
            {!collapsed && <span className={styles.groupLabel}>{group.label}</span>}
            <ul className={styles.items}>
              {group.items.map((item) => {
                const isActive = pathname === item.href;
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
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {!collapsed && <span className={styles.version}>v{APP_VERSION}</span>}
    </aside>
  );
}
