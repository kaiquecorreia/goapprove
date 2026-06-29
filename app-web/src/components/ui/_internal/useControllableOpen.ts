'use client';

import { useState } from 'react';

interface UseControllableOpenArgs {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function useControllableOpen({ open, defaultOpen, onOpenChange }: UseControllableOpenArgs) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen ?? false);
  const isOpen = open ?? internalOpen;

  const setOpen = (next: boolean) => {
    setInternalOpen(next);
    onOpenChange?.(next);
  };

  return { isOpen, setOpen };
}
