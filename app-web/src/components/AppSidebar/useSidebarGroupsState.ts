'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'goapprove:sidebar:groups';

type GroupsOpenState = Record<string, boolean>;

function readStoredState(): GroupsOpenState {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as GroupsOpenState) : {};
  } catch {
    return {};
  }
}

function persistState(state: GroupsOpenState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage indisponível (modo privado, quota) — estado segue funcionando em memória
  }
}

interface UseSidebarGroupsStateArgs {
  activeGroupId: string | null;
}

export function useSidebarGroupsState({ activeGroupId }: UseSidebarGroupsStateArgs) {
  const [openState, setOpenState] = useState<GroupsOpenState>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setOpenState(readStoredState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || !activeGroupId) return;
    setOpenState((prev) => {
      if (prev[activeGroupId] !== false) return prev;
      const next = { ...prev, [activeGroupId]: true };
      persistState(next);
      return next;
    });
  }, [hydrated, activeGroupId]);

  function isGroupOpen(groupId: string): boolean {
    return openState[groupId] ?? true;
  }

  function toggleGroup(groupId: string) {
    setOpenState((prev) => {
      const next = { ...prev, [groupId]: !(prev[groupId] ?? true) };
      persistState(next);
      return next;
    });
  }

  return { isGroupOpen, toggleGroup };
}
