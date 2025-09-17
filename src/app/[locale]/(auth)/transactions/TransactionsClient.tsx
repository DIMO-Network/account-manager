'use client';

import { TransactionIcon } from '@/components/Icons';
import { Loading } from '@/components/Loading';
import { TransactionCategoryFilter } from '@/components/transactions/TransactionCategoryFilter';
import { TransactionHistoryItem } from '@/components/transactions/TransactionHistoryItem';
import { TransactionPagination } from '@/components/transactions/TransactionPagination';
import { PageHeader } from '@/components/ui';
import { BORDER_RADIUS, COLORS, RESPONSIVE } from '@/utils/designSystem';
import { useEffect, useMemo, useState } from 'react';
import type { TransactionCategory, TransactionHistoryEntry } from '@/types/transaction';

type TransactionsClientProps = {
  translations: {
    title: string;
    loading: string;
    no_transactions: string;
  };
};

export function TransactionsClient({ translations }: TransactionsClientProps) {
  const [transactions, setTransactions] = useState<TransactionHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<TransactionCategory>('all');
  const [walletAddress, setWalletAddress] = useState<string | undefined>();

  // Fetch transaction history and wallet address
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch both transaction history and user session data
        const [transactionsResponse, sessionResponse] = await Promise.all([
          fetch('/api/transaction-history'),
          fetch('/api/auth/me'),
        ]);

        if (!transactionsResponse.ok) {
          throw new Error('Failed to fetch transactions');
        }

        const transactionsData = await transactionsResponse.json();
        setTransactions(transactionsData);

        // Get wallet address from session if available
        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json();
          setWalletAddress(sessionData.walletAddress);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load transactions');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Group transactions by category
  const categories = useMemo(() => {
    const groupedTransactions = transactions.reduce(
      (accum, curr) => {
        const rewardType = curr.type ? curr.type.toLowerCase() : 'other';
        const categoryKey = rewardType;
        const existingArray = accum[categoryKey];

        if (existingArray) {
          existingArray.push(curr);
        } else {
          accum[categoryKey] = [curr];
        }

        return accum;
      },
      {} as Record<string, TransactionHistoryEntry[]>,
    );

    return {
      all: transactions,
      baseline: groupedTransactions.baseline || [],
      referrals: groupedTransactions.referrals || [],
      marketplace: groupedTransactions.marketplace || [],
      other: groupedTransactions.other || [],
    };
  }, [transactions]);

  const currentItems = categories[selectedCategory];

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center">
          <Loading className="mx-auto" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center py-12">
          <p className={`${RESPONSIVE.text.body} text-red-400`}>
            Error:
            {' '}
            {error}
          </p>
        </div>
      );
    }

    if (currentItems.length === 0) {
      return (
        <div className="flex items-center justify-center py-12">
          <p className={`${RESPONSIVE.text.body} ${COLORS.text.secondary}`}>
            {translations.no_transactions}
          </p>
        </div>
      );
    }

    return (
      <TransactionPagination
        key={`${selectedCategory}-${currentItems.length}`}
        transactions={currentItems}
        pageLength={5}
        childrenAction={paginatedTransactions => (
          <div className="space-y-3">
            {paginatedTransactions.map(transaction => (
              <TransactionHistoryItem
                key={`${transaction.from}-${transaction.to}-${transaction.time}-${transaction.value}`}
                {...transaction}
                walletAddress={walletAddress}
              />
            ))}
          </div>
        )}
      />
    );
  };

  return (
    <div className="flex flex-1 flex-col gap-4">
      {/* Header */}
      <PageHeader icon={<TransactionIcon />} title={translations.title} className="mb-0" />

      {/* Category Filter */}
      {!loading && !error && transactions.length > 0 && (
        <TransactionCategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChangeAction={setSelectedCategory}
        />
      )}

      {/* Content */}
      <div className={`${BORDER_RADIUS.xl} ${COLORS.background.secondary} p-6`}>
        {renderContent()}
      </div>
    </div>
  );
}
