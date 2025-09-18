'use client';

import { RecoveryIcon } from '@/components/Icons';
import { PageHeader } from '@/components/ui';
import { BORDER_RADIUS, COLORS } from '@/utils/designSystem';

type RecoveryClientProps = {
  translations: {
    title: string;
    description: string;
    coming_soon: string;
  };
};

export function RecoveryClient({ translations }: RecoveryClientProps) {
  return (
    <div className="flex flex-1 flex-col gap-4">
      {/* Header */}
      <PageHeader icon={<RecoveryIcon />} title={translations.title} className="mb-0" />

      {/* Content */}
      <div className={`${BORDER_RADIUS.xl} ${COLORS.background.secondary} p-6`}>
        {translations.description}
      </div>
    </div>
  );
}
