'use client';

import { ReactNode, useState } from 'react';
import { AppSidebar } from '@/components/AppSidebar';
import { Topbar } from '@/components/Topbar';
import styles from './styles.module.scss';

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={styles.shell}>
      <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} />
      <div className={styles.mainColumn}>
        <Topbar />
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
