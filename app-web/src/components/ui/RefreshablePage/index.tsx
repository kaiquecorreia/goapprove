'use client';

import { ReactNode, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { RefreshButton } from '@/components/ui/RefreshButton';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';

interface RefreshablePageProps {
  title: string;
  description?: string;
  extraActions?: ReactNode;
  children: ReactNode;
}

// For Server Component pages: pairs the refresh button with the same
// dim-content-and-overlay-a-spinner treatment used by client-fetched pages,
// re-running the page's server-side data fetch via router.refresh().
export function RefreshablePage({
  title,
  description,
  extraActions,
  children,
}: RefreshablePageProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <PageHeader
        title={title}
        description={description}
        actions={
          <>
            <RefreshButton
              isLoading={isPending}
              onRefresh={() => startTransition(() => router.refresh())}
            />
            {extraActions}
          </>
        }
      />
      <LoadingOverlay isLoading={isPending}>{children}</LoadingOverlay>
    </>
  );
}
