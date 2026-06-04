'use client';

import type { ReactNode } from 'react';
import type { TransactionHistoryEntry } from '@/types/transaction';
import { ListPagination } from '@/components/ui/ListPagination';

type TransactionPaginationProps = {
  transactions: TransactionHistoryEntry[];
  pageLength?: number;
  childrenAction: (paginatedTransactions: TransactionHistoryEntry[]) => ReactNode;
};

export function TransactionPagination({
  transactions,
  pageLength = 5,
  childrenAction,
}: TransactionPaginationProps) {
  return (
    <ListPagination
      items={transactions}
      pageLength={pageLength}
      childrenAction={childrenAction}
    />
  );
}
