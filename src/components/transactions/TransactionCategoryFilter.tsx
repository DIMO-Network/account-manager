'use client';

import type { TransactionCategory, TransactionHistoryEntry } from '@/types/transaction';
import { BORDER_RADIUS, COLORS } from '@/utils/designSystem';

type TransactionCategoryFilterProps = {
  categories: Record<string, TransactionHistoryEntry[]>;
  selectedCategory: TransactionCategory;
  onCategoryChangeAction: (category: TransactionCategory) => void;
};

export function TransactionCategoryFilter({
  categories,
  selectedCategory,
  onCategoryChangeAction,
}: TransactionCategoryFilterProps) {
  const categoryLabels: Record<TransactionCategory, string> = {
    all: 'All',
    baseline: 'Baseline',
    referrals: 'Referrals',
    marketplace: 'Marketplace',
    creditTopUp: 'Credit Top-up',
    other: 'Other',
  };

  return (
    <div className="flex flex-wrap gap-2 pb-2">
      {Object.keys(categories).map((category) => {
        const categoryKey = category as TransactionCategory;
        const isSelected = selectedCategory === categoryKey;
        const count = categories[categoryKey]?.length || 0;

        return (
          <button
            type="button"
            key={category}
            onClick={() => onCategoryChangeAction(categoryKey)}
            className={`${BORDER_RADIUS.full} px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
              isSelected
                ? `${COLORS.background.secondary} ${COLORS.text.primary}`
                : `${COLORS.background.primary} ${COLORS.text.secondary} hover:${COLORS.background.secondary}`
            }`}
          >
            {categoryLabels[categoryKey]}
            {' '}
            {count > 0 && `(${count})`}
          </button>
        );
      })}
    </div>
  );
}
