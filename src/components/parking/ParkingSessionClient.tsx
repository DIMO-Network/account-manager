'use client';

import type {
  ParkingAssistSessionDetail,
  ParkingCorporateCheckoutStatus,
  StartCorporateCheckoutResponse,
} from '@/types/parking-assist';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { BORDER_RADIUS, COLORS, RESPONSIVE } from '@/utils/designSystem';
import { ParkingCheckoutStatusBadge } from './ParkingCheckoutStatusBadge';

type ParkingSessionClientProps = {
  sessionId: string;
  initialDetail: ParkingAssistSessionDetail;
  translations: {
    vehicle_label: string;
    license_plate_label: string;
    license_plate_not_set: string;
    license_plate_missing_hint: string;
    license_plate_required_error: string;
    triggered_at_label: string;
    checkout_status_label: string;
    pay_with_dimo: string;
    paying: string;
    refresh: string;
    pay_error: string;
    status_pending: string;
    status_running: string;
    status_paid: string;
    status_failed: string;
    status_cancelled: string;
    paid_message: string;
    failed_message: string;
    no_checkout: string;
    pending_queued_message: string;
  };
  locale: string;
};

/** Poll while checkout is in progress; cap requests until automation updates status. */
const POLL_INTERVAL_MS = 5000;
const MAX_POLL_ATTEMPTS = 12;

function isInProgress(status: ParkingCorporateCheckoutStatus | undefined): boolean {
  return status === 'pending' || status === 'running';
}

function resolveApiErrorMessage(
  body: { error?: string; message?: string | string[] },
  fallback: string,
  licensePlateRequiredMessage: string,
): string {
  const raw = body.error ?? body.message;
  const message = Array.isArray(raw) ? raw.join(' ') : raw;
  if (message?.includes('license_plate_required')) {
    return licensePlateRequiredMessage;
  }
  return message ?? fallback;
}

export function ParkingSessionClient({
  sessionId,
  initialDetail,
  translations: t,
  locale,
}: ParkingSessionClientProps) {
  const [detail, setDetail] = useState(initialDetail);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pollingExhausted, setPollingExhausted] = useState(false);

  const statusLabels = useMemo<Record<ParkingCorporateCheckoutStatus, string>>(
    () => ({
      pending: t.status_pending,
      running: t.status_running,
      paid: t.status_paid,
      failed: t.status_failed,
      cancelled: t.status_cancelled,
    }),
    [t],
  );

  const refreshSession = useCallback(async () => {
    const response = await fetch(`/api/parking-assist/sessions/${sessionId}`, { cache: 'no-store' });
    if (!response.ok) {
      return;
    }
    const data = (await response.json()) as ParkingAssistSessionDetail;
    setDetail(data);
  }, [sessionId]);

  const checkoutStatus = detail.latestCheckout?.status;

  const vehicleLicensePlate
    = detail.vehicleLicensePlate ?? detail.latestCheckout?.licensePlate ?? null;
  const hasLicensePlate = Boolean(vehicleLicensePlate?.trim());

  useEffect(() => {
    if (!isInProgress(checkoutStatus)) {
      setPollingExhausted(false);
      return;
    }
    if (pollingExhausted) {
      return;
    }

    let attempts = 0;
    const id = window.setInterval(() => {
      attempts += 1;
      if (attempts >= MAX_POLL_ATTEMPTS) {
        window.clearInterval(id);
        setPollingExhausted(true);
        return;
      }
      void refreshSession();
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(id);
  }, [checkoutStatus, pollingExhausted, refreshSession]);

  const checkoutAllowsPay
    = !checkoutStatus || checkoutStatus === 'failed' || checkoutStatus === 'cancelled';

  const canPay = !paying && hasLicensePlate && checkoutAllowsPay;

  const showMissingPlateHint = !hasLicensePlate && checkoutAllowsPay;

  const handlePay = async () => {
    setPaying(true);
    setError(null);
    try {
      const idempotencyKey = crypto.randomUUID();
      const response = await fetch(
        `/api/parking-assist/sessions/${sessionId}/corporate-checkout`,
        {
          method: 'POST',
          headers: { 'Idempotency-Key': idempotencyKey },
        },
      );

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as {
          error?: string;
          message?: string | string[];
        };
        throw new Error(
          resolveApiErrorMessage(body, t.pay_error, t.license_plate_required_error),
        );
      }

      await response.json() as StartCorporateCheckoutResponse;
      setPollingExhausted(false);
      await refreshSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.pay_error);
    } finally {
      setPaying(false);
    }
  };

  const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString(locale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

  const vehicleLabel
    = detail.vehicleDisplayName ?? `${t.vehicle_label} ${detail.session.vehicleTokenId}`;

  return (
    <div className={`flex flex-col gap-6 ${BORDER_RADIUS.lg}`}>
      <div className={`${COLORS.background.primary} p-4 flex flex-col gap-4`}>
        <div>
          <p className={`${RESPONSIVE.text.body} ${COLORS.text.secondary} mb-1`}>{t.vehicle_label}</p>
          <p className={`${RESPONSIVE.text.body} font-medium ${COLORS.text.primary}`}>{vehicleLabel}</p>
        </div>
        <div>
          <p className={`${RESPONSIVE.text.body} ${COLORS.text.secondary} mb-1`}>{t.license_plate_label}</p>
          <p
            className={`${RESPONSIVE.text.body} font-medium ${
              hasLicensePlate ? COLORS.text.primary : COLORS.text.secondary
            }`}
          >
            {hasLicensePlate ? vehicleLicensePlate : t.license_plate_not_set}
          </p>
        </div>
        <div>
          <p className={`${RESPONSIVE.text.body} ${COLORS.text.secondary} mb-1`}>{t.triggered_at_label}</p>
          <p className={`${RESPONSIVE.text.body} ${COLORS.text.primary}`}>
            {formatDateTime(detail.session.triggeredAt)}
          </p>
        </div>
        <div>
          <p className={`${RESPONSIVE.text.body} ${COLORS.text.secondary} mb-2`}>{t.checkout_status_label}</p>
          {detail.latestCheckout
            ? (
                <ParkingCheckoutStatusBadge
                  status={detail.latestCheckout.status}
                  label={statusLabels[detail.latestCheckout.status]}
                />
              )
            : (
                <span className={`${RESPONSIVE.text.body} ${COLORS.text.secondary}`}>{t.no_checkout}</span>
              )}
        </div>
        {checkoutStatus === 'paid' && (
          <p className={`${RESPONSIVE.text.body} ${COLORS.feedback.success}`}>{t.paid_message}</p>
        )}
        {checkoutStatus === 'failed' && (
          <p className={`${RESPONSIVE.text.body} ${COLORS.feedback.error}`}>
            {detail.latestCheckout?.failureMessage ?? t.failed_message}
          </p>
        )}
        {checkoutStatus === 'pending' && pollingExhausted && (
          <p className={`${RESPONSIVE.text.body} ${COLORS.text.secondary}`}>
            {t.pending_queued_message}
          </p>
        )}
      </div>

      {showMissingPlateHint && (
        <p className={`${RESPONSIVE.text.body} ${COLORS.text.secondary}`}>{t.license_plate_missing_hint}</p>
      )}

      {error && (
        <p className={`${RESPONSIVE.text.body} ${COLORS.feedback.error}`}>{error}</p>
      )}

      <div className="flex flex-wrap gap-3">
        {canPay && (
          <button
            type="button"
            onClick={() => void handlePay()}
            className={`px-4 py-2 ${BORDER_RADIUS.md} ${COLORS.button.primary} ${RESPONSIVE.text.body} font-medium`}
          >
            {paying ? t.paying : t.pay_with_dimo}
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            setPollingExhausted(false);
            void refreshSession();
          }}
          className={`px-4 py-2 ${BORDER_RADIUS.md} ${COLORS.button.secondaryTransparent} ${RESPONSIVE.text.body}`}
        >
          {t.refresh}
        </button>
      </div>
    </div>
  );
}
