'use client';

import type { TransactionHistoryEntry } from '@/types/transaction';
import { useState } from 'react';

type TransactionPaginationProps = {
  transactions: TransactionHistoryEntry[];
  pageLength?: number;
  childrenAction: (paginatedTransactions: TransactionHistoryEntry[]) => React.ReactNode;
};

export function TransactionPagination({
  transactions,
  pageLength = 5,
  childrenAction,
}: TransactionPaginationProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(transactions.length / pageLength);

  // Reset to last valid page if current page exceeds total pages
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(totalPages);
  }

  const startIndex = (currentPage - 1) * pageLength;
  const endIndex = startIndex + pageLength;
  const paginatedTransactions = transactions.slice(startIndex, endIndex);

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  if (transactions.length === 0) {
    return <>{childrenAction([])}</>;
  }

  return (
    <div className="space-y-4">
      {/* Paginated Content */}
      {childrenAction(paginatedTransactions)}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col items-center pt-6 px-6">
          <div className="flex items-center">
            {/* Previous Button */}
            <button
              type="button"
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              className={`p-2 transition-colors ${
                currentPage === 1
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-800 text-white hover:bg-gray-700'
              } rounded-l-lg`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Page Info */}
            <div className="bg-gray-800 px-3 py-2 flex items-center justify-center">
              <span className="text-sm text-gray-300">
                Page
                {' '}
                {currentPage}
                {' '}
                of
                {' '}
                {totalPages}
              </span>
            </div>

            {/* Next Button */}
            <button
              type="button"
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className={`p-2 transition-colors ${
                currentPage === totalPages
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-800 text-white hover:bg-gray-700'
              } rounded-r-lg`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
