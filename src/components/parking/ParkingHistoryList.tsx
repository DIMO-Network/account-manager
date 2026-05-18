import type { ParkingAssistHistory, ParkingCorporateCheckoutStatus } from '@/types/parking-assist';
import Link from 'next/link';
import { BORDER_RADIUS, COLORS, RESPONSIVE } from '@/utils/designSystem';
import { ParkingCheckoutStatusBadge } from './ParkingCheckoutStatusBadge';

type ParkingHistoryListProps = {
  history: ParkingAssistHistory;
  statusLabels: Record<ParkingCorporateCheckoutStatus, string>;
  noCheckoutLabel: string;
  locale: string;
};

function formatDateTime(iso: string, locale: string): string {
  return new Date(iso).toLocaleString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function ParkingHistoryList({
  history,
  statusLabels,
  noCheckoutLabel,
  locale,
}: ParkingHistoryListProps) {
  if (history.items.length === 0) {
    return null;
  }

  return (
    <ul className="flex flex-col gap-3">
      {history.items.map((item) => {
        const href = `/parking/sessions/${item.session.id}`;
        const checkout = item.latestCheckout;

        return (
          <li key={item.session.id}>
            <Link
              href={href}
              className={`block ${BORDER_RADIUS.lg} ${COLORS.background.primary} p-4 hover:bg-surface-raised transition-colors`}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-1">
                  <span className={`${RESPONSIVE.text.body} font-medium ${COLORS.text.primary}`}>
                    {item.vehicleDisplayName ?? `Vehicle ${item.session.vehicleTokenId}`}
                  </span>
                  <span className={`${RESPONSIVE.text.body} ${COLORS.text.secondary}`}>
                    {formatDateTime(item.session.triggeredAt, locale)}
                  </span>
                </div>
                <div>
                  {checkout
                    ? (
                        <ParkingCheckoutStatusBadge
                          status={checkout.status}
                          label={statusLabels[checkout.status]}
                        />
                      )
                    : (
                        <span className={`${RESPONSIVE.text.body} ${COLORS.text.secondary}`}>
                          {noCheckoutLabel}
                        </span>
                      )}
                </div>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
