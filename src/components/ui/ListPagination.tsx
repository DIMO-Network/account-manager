'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';

type ListPaginationControlsVariant = 'default' | 'transparent';

type ListPaginationProps<T> = {
  items: T[];
  pageLength?: number;
  controlsVariant?: ListPaginationControlsVariant;
  childrenAction: (paginatedItems: T[]) => ReactNode;
};

const CONTROLS_STYLES: Record<
  ListPaginationControlsVariant,
  { buttonEnabled: string; buttonDisabled: string; pageInfo: string }
> = {
  default: {
    buttonEnabled: 'bg-gray-800 text-white hover:bg-gray-700',
    buttonDisabled: 'bg-gray-800 text-gray-500 cursor-not-allowed',
    pageInfo: 'bg-gray-800',
  },
  transparent: {
    buttonEnabled: 'bg-transparent text-white hover:text-gray-300',
    buttonDisabled: 'bg-transparent text-gray-500 cursor-not-allowed',
    pageInfo: 'bg-transparent',
  },
};

export function ListPagination<T>({
  items,
  pageLength = 5,
  controlsVariant = 'default',
  childrenAction,
}: ListPaginationProps<T>) {
  const controls = CONTROLS_STYLES[controlsVariant];
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / pageLength));
  const page = Math.min(currentPage, totalPages);

  const startIndex = (page - 1) * pageLength;
  const paginatedItems = items.slice(startIndex, startIndex + pageLength);

  const goToPreviousPage = () => {
    setCurrentPage(previous => Math.max(1, previous - 1));
  };

  const goToNextPage = () => {
    setCurrentPage(previous => Math.min(totalPages, previous + 1));
  };

  if (items.length === 0) {
    return <>{childrenAction([])}</>;
  }

  return (
    <div className="space-y-4">
      {childrenAction(paginatedItems)}

      {totalPages > 1 && (
        <div className="flex flex-col items-center pt-6 px-6">
          <div className="flex items-center">
            <button
              type="button"
              onClick={goToPreviousPage}
              disabled={page === 1}
              className={`p-2 transition-colors rounded-l-lg ${
                page === 1 ? controls.buttonDisabled : controls.buttonEnabled
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className={`${controls.pageInfo} px-3 py-2 flex items-center justify-center`}>
              <span className="text-sm text-gray-300">
                Page
                {' '}
                {page}
                {' '}
                of
                {' '}
                {totalPages}
              </span>
            </div>

            <button
              type="button"
              onClick={goToNextPage}
              disabled={page === totalPages}
              className={`p-2 transition-colors rounded-r-lg ${
                page === totalPages ? controls.buttonDisabled : controls.buttonEnabled
              }`}
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
