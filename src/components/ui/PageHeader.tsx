import type { ReactNode } from 'react';
import { COLORS } from '@/utils/designSystem';

type PageHeaderProps = {
  icon: ReactNode;
  title: string;
  className?: string;
  children?: ReactNode;
};

export function PageHeader({ icon, title, className = '', children }: PageHeaderProps) {
  return (
    <div className={`flex flex-row items-center justify-between border-b border-gray-700 pb-2 ${className}`}>
      <div className="flex flex-row items-center gap-2">
        <div className={`flex h-4 w-4 shrink-0 items-center justify-center ${COLORS.text.secondary}`}>
          {icon}
        </div>
        <h1 className={`text-base font-medium leading-6 ${COLORS.text.secondary}`}>{title}</h1>
      </div>
      {children}
    </div>
  );
}
