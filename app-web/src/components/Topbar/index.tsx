'use client';

import { Bell, LogOut, Search } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar } from '@/components/ui/Avatar';
import { USER_ROLE_LABELS } from '@/lib/userRoleLabels';
import styles from './styles.module.scss';

export function Topbar() {
  const { logout } = useAuth();
  const { data: session } = useSession();
  const userName = session?.user?.name ?? '';
  const roleLabel = session?.role ? USER_ROLE_LABELS[session.role] : '';

  return (
    <header className={styles.topbar}>
      <div className={styles.search}>
        <Search size={16} className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Buscar OC, fornecedor, usuário..."
          className={styles.searchInput}
        />
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.iconButton} aria-label="Notificações">
          <Bell size={18} />
          <span className={styles.notificationDot} />
        </button>

        <div className={styles.user}>
          <Avatar name={userName} size="sm" />
          <div className={styles.userInfo}>
            <span className={styles.userName}>{userName}</span>
            <span className={styles.userProfile}>{roleLabel}</span>
          </div>
        </div>

        <button
          type="button"
          className={styles.iconButton}
          aria-label="Sair"
          onClick={() => logout()}
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
