import { COLORS } from '@/utils/designSystem';
import type { ReactNode } from 'react';

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
        <div className={`w-4 h-4 ${COLORS.text.secondary}`}>
          {icon}
        </div>
        <h1 className={`text-base font-medium leading-6 ${COLORS.text.secondary}`}>{title}</h1>
      </div>
      {children}
    </div>
  );
}
