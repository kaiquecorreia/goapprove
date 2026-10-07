'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ChevronDown, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { EUserRole, navigationGroups } from '@/config/navigation';
import { cx } from '@/lib/cx';
import Logo from '@/components/Logo';
import { APP_VERSION } from '@/lib/version';
import { useSidebarGroupsState } from './useSidebarGroupsState';
import styles from './styles.module.scss';

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.role as EUserRole | undefined;

  // Groups declared without items (placeholders for upcoming sections) stay visible;
  // the others are hidden when the role can't access any of their items.
  const visibleGroups = navigationGroups
    .map((group) => ({
      ...group,
      isPlaceholder: group.items.length === 0,
      items: group.items.filter((item) => role && item.allowedRoles.includes(role)),
    }))
    .filter((group) => group.isPlaceholder || group.items.length > 0);

  const activeGroup = visibleGroups.find((group) =>
    group.items.some((item) => item.href === pathname),
  );

  const { isGroupOpen, toggleGroup } = useSidebarGroupsState({
    activeGroupId: activeGroup?.id ?? null,
  });

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
        {visibleGroups.map((group) => {
          const isOpen = collapsed || !group.collapsible || isGroupOpen(group.id);

          return (
            <div key={group.id} className={styles.group}>
              {!collapsed && group.collapsible && (
                <button
                  type="button"
                  className={styles.groupHeader}
                  onClick={() => toggleGroup(group.id)}
                  aria-expanded={isGroupOpen(group.id)}
                  aria-controls={`sidebar-group-${group.id}`}
                >
                  <span className={styles.groupLabel}>{group.label}</span>
                  <ChevronDown
                    size={14}
                    className={cx(
                      styles.groupChevron,
                      isGroupOpen(group.id) && styles.groupChevronOpen,
                    )}
                  />
                </button>
              )}

              {!collapsed && !group.collapsible && (
                <span className={styles.groupLabel}>{group.label}</span>
              )}

              <ul
                id={`sidebar-group-${group.id}`}
                className={cx(
                  styles.items,
                  group.collapsible && !collapsed && styles.itemsCollapsible,
                  group.collapsible && !collapsed && !isOpen && styles.itemsClosed,
                )}
              >
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
          );
        })}
      </nav>

      {!collapsed && <span className={styles.version}>v{APP_VERSION}</span>}
    </aside>
  );
}
