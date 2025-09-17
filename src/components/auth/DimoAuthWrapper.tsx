'use client';

import { initializeDimo } from '@/libs/DimoConfig';
import { DimoAuthProvider } from '@dimo-network/login-with-dimo';
import { useEffect, useState } from 'react';

type DimoAuthWrapperProps = {
  children: React.ReactNode;
};

export const DimoAuthWrapper = ({ children }: DimoAuthWrapperProps) => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        initializeDimo();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize DIMO:', error);
      }
    };

    initialize();
  }, []);

  if (!isInitialized) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse bg-gray-200 h-8 rounded mb-4"></div>
        <div className="animate-pulse bg-gray-200 h-32 rounded"></div>
      </div>
    );
  }

  return <DimoAuthProvider>{children}</DimoAuthProvider>;
};
