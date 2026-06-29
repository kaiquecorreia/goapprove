'use client';

import { Bell, LogOut, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { currentUser } from '@/lib/mock/users';
import { Avatar } from '@/components/ui/Avatar';
import styles from './styles.module.scss';

export function Topbar() {
  const { logout } = useAuth();

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
          <Avatar name={currentUser.name} size="sm" />
          <div className={styles.userInfo}>
            <span className={styles.userName}>{currentUser.name}</span>
            <span className={styles.userProfile}>{currentUser.profile}</span>
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
