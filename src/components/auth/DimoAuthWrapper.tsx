'use client';

import { DimoAuthProvider } from '@dimo-network/login-with-dimo';
import { useEffect, useState } from 'react';
import { initializeDimo } from '@/libs/DimoConfig';

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
        <div className="animate-pulse bg-gray-800 h-8 rounded mb-4"></div>
        <div className="animate-pulse bg-gray-800 h-32 rounded"></div>
      </div>
    );
  }

  return <DimoAuthProvider>{children}</DimoAuthProvider>;
};
