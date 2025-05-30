'use client';

import { initializeDimo } from '@/libs/DimoConfig';
import { DimoAuthProvider } from '@dimo-network/login-with-dimo';
import { useEffect } from 'react';

type DimoAuthWrapperProps = {
  children: React.ReactNode;
};

export const DimoAuthWrapper = ({ children }: DimoAuthWrapperProps) => {
  useEffect(() => {
    initializeDimo();
  }, []);

  return <DimoAuthProvider>{children}</DimoAuthProvider>;
};
