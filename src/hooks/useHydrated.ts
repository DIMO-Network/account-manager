'use client';

import { useEffect, useState } from 'react';

/** False on server and the first client render; true after hydration completes. */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return hydrated;
}
