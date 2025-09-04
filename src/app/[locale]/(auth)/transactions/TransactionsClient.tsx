'use client';

import { TransactionIcon } from '@/components/Icons';
import { PageHeader } from '@/components/ui';
import { BORDER_RADIUS, COLORS, RESPONSIVE } from '@/utils/designSystem';

type TransactionsClientProps = {
  translations: {
    title: string;
    subtitle: string;
    loading: string;
    no_transactions: string;
  };
};

export function TransactionsClient({ translations }: TransactionsClientProps) {
  return (
    <div className="flex flex-1 flex-col gap-4">
      {/* Header */}
      <PageHeader icon={<TransactionIcon />} title={translations.title} className="mb-0" />

      {/* Content */}
      <div className={`${BORDER_RADIUS.xl} ${COLORS.background.secondary}`}>
        <div className="flex items-center justify-center py-12">
          <p className={`${RESPONSIVE.text.body} ${COLORS.text.secondary}`}>
            {translations.no_transactions}
          </p>
        </div>
      </div>
    </div>
  );
}
