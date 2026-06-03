'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/** False on server and during hydration; true after the client has mounted. */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
