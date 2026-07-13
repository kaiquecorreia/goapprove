import { redirect } from 'next/navigation';
import { ReactNode } from 'react';

import { isInforLoginEnabled } from '@/lib/auth';

export default function LoginInforLayout({ children }: { children: ReactNode }) {
  if (!isInforLoginEnabled()) {
    redirect('/login');
  }

  return children;
}
