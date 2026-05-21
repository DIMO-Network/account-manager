'use client';

import type {
  ParkingAssistSessionDetail,
  ParkingCorporateCheckoutStatus,
  ParkingService,
  ParkingServicesCatalog,
  StartCorporateCheckoutResponse,
} from '@/types/parking-assist';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { BORDER_RADIUS, COLORS, RESPONSIVE } from '@/utils/designSystem';
import { isNoPaymentRequiredCheckout } from '@/utils/parking-checkout';
import {
  findCatalogService,
  initialParkingCheckoutSelections,
  isDurationAllowedForCatalogService,
  parkingDurationTranslationKey,
} from '@/utils/parking-services';
import { hasZoneCode, normalizeZoneCode } from '@/utils/zone-code';
import { ParkingCheckoutStatusBadge } from './ParkingCheckoutStatusBadge';

type ParkingSessionClientProps = {
  sessionId: string;
  initialDetail: ParkingAssistSessionDetail;
  parkingServicesCatalog: ParkingServicesCatalog;
  translations: {
    vehicle_label: string;
    license_plate_label: string;
    license_plate_not_set: string;
    license_plate_missing_hint: string;
    license_plate_required_error: string;
    parking_service_label: string;
    duration_label: string;
    duration_option_60: string;
    duration_option_75: string;
    duration_option_90: string;
    duration_option_105: string;
    duration_option_120: string;
    duration_missing_hint: string;
    duration_minutes_required_error: string;
    duration_minutes_invalid_error: string;
    parking_service_invalid_error: string;
    zone_code_label: string;
    zone_code_placeholder: string;
    zone_sign_hint: string;
    zone_code_missing_hint: string;
    zone_code_required_error: string;
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
    status_no_payment_required: string;
    status_cancelled: string;
    paid_message: string;
    failed_message: string;
    no_payment_required_message: string;
    no_checkout: string;
    pending_queued_message: string;
  };
  locale: string;
};

/** Poll while checkout is in progress (pending/running). Nova Act automation often needs ~3 min. */
const POLL_INTERVAL_MS = 5000;
const MAX_POLL_ATTEMPTS = 36;

const selectClassName = `rounded-md bg-surface-raised px-4 py-2 w-full ${RESPONSIVE.text.body} ${COLORS.text.primary}`;

function isInProgress(status: ParkingCorporateCheckoutStatus | undefined): boolean {
  return status === 'pending' || status === 'running';
}

type PayErrorMessages = {
  fallback: string;
  licensePlateRequired: string;
  zoneCodeRequired: string;
  durationRequired: string;
  durationInvalid: string;
  parkingServiceInvalid: string;
};

function resolveApiErrorMessage(
  body: { error?: string; message?: string | string[] },
  messages: PayErrorMessages,
): string {
  const raw = body.error ?? body.message;
  const message = Array.isArray(raw) ? raw.join(' ') : raw;
  if (message?.includes('license_plate_required')) {
    return messages.licensePlateRequired;
  }
  if (message?.includes('zone_code_required')) {
    return messages.zoneCodeRequired;
  }
  if (message?.includes('duration_minutes_required')) {
    return messages.durationRequired;
  }
  if (message?.includes('duration_minutes_invalid')) {
    return messages.durationInvalid;
  }
  if (message?.includes('parking_service_invalid')) {
    return messages.parkingServiceInvalid;
  }
  return message ?? messages.fallback;
}

function initialZoneCodeInput(detail: ParkingAssistSessionDetail): string {
  const checkout = detail.latestCheckout;
  if (!checkout) {
    return '';
  }
  return checkout.zoneLabel ?? checkout.zoneId ?? '';
}

function durationLabelFromTranslations(
  minutes: number,
  translations: ParkingSessionClientProps['translations'],
): string {
  const key = parkingDurationTranslationKey(minutes) as keyof ParkingSessionClientProps['translations'];
  const label = translations[key];
  return typeof label === 'string' ? label : String(minutes);
}

export function ParkingSessionClient({
  sessionId,
  initialDetail,
  parkingServicesCatalog,
  translations: t,
  locale,
}: ParkingSessionClientProps) {
  const initialSelections = useMemo(
    () => initialParkingCheckoutSelections(parkingServicesCatalog, initialDetail.latestCheckout),
    [parkingServicesCatalog, initialDetail.latestCheckout],
  );

  const [detail, setDetail] = useState(initialDetail);
  const [zoneCodeInput, setZoneCodeInput] = useState(() => initialZoneCodeInput(initialDetail));
  const [parkingServiceId, setParkingServiceId] = useState<ParkingService | ''>(
    () => initialSelections?.parkingServiceId ?? '',
  );
  const [durationMinutes, setDurationMinutes] = useState<number | null>(
    () => initialSelections?.durationMinutes ?? null,
  );
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
  const noPaymentRequired = isNoPaymentRequiredCheckout(detail.latestCheckout);

  const vehicleLicensePlate
    = detail.vehicleLicensePlate ?? detail.latestCheckout?.licensePlate ?? null;
  const hasLicensePlate = Boolean(vehicleLicensePlate?.trim());
  const hasValidZoneCode = hasZoneCode(zoneCodeInput);

  const selectedCatalogEntry = useMemo(
    () => findCatalogService(parkingServicesCatalog, parkingServiceId || undefined),
    [parkingServicesCatalog, parkingServiceId],
  );

  const hasValidParkingService = Boolean(selectedCatalogEntry);
  const hasValidDuration = isDurationAllowedForCatalogService(selectedCatalogEntry, durationMinutes);

  const checkoutInProgress = isInProgress(checkoutStatus);
  const showStillProcessingMessage
    = (checkoutStatus === 'pending' || checkoutStatus === 'running') && pollingExhausted;

  useEffect(() => {
    if (!checkoutInProgress || pollingExhausted) {
      return;
    }

    void refreshSession();
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
  }, [checkoutInProgress, pollingExhausted, refreshSession]);

  const checkoutAllowsPay
    = !checkoutStatus || checkoutStatus === 'failed' || checkoutStatus === 'cancelled';

  const canPay
    = !paying
      && hasLicensePlate
      && hasValidParkingService
      && hasValidDuration
      && hasValidZoneCode
      && checkoutAllowsPay;

  const showMissingPlateHint = !hasLicensePlate && checkoutAllowsPay;
  const showMissingDurationHint
    = hasLicensePlate && hasValidParkingService && !hasValidDuration && checkoutAllowsPay;
  const showMissingZoneHint
    = hasLicensePlate
      && hasValidParkingService
      && hasValidDuration
      && !hasValidZoneCode
      && checkoutAllowsPay;

  const zoneHint = selectedCatalogEntry?.zoneCodeHint ?? t.zone_sign_hint;

  const handleParkingServiceChange = (nextServiceId: string) => {
    setParkingServiceId(nextServiceId as ParkingService);
    const entry = findCatalogService(parkingServicesCatalog, nextServiceId as ParkingService);
    if (entry && !isDurationAllowedForCatalogService(entry, durationMinutes)) {
      setDurationMinutes(entry.defaultDurationMinutes);
    }
  };

  const handlePay = async () => {
    setPaying(true);
    setError(null);
    try {
      const idempotencyKey = crypto.randomUUID();
      const zoneCode = normalizeZoneCode(zoneCodeInput);
      if (!zoneCode) {
        throw new Error(t.zone_code_required_error);
      }
      if (!hasValidDuration || durationMinutes == null) {
        throw new Error(t.duration_minutes_required_error);
      }
      if (!parkingServiceId) {
        throw new Error(t.parking_service_invalid_error);
      }

      const response = await fetch(
        `/api/parking-assist/sessions/${sessionId}/corporate-checkout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': idempotencyKey,
          },
          body: JSON.stringify({
            zoneCode,
            durationMinutes,
            parkingService: parkingServiceId,
          }),
        },
      );

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as {
          error?: string;
          message?: string | string[];
        };
        throw new Error(
          resolveApiErrorMessage(body, {
            fallback: t.pay_error,
            licensePlateRequired: t.license_plate_required_error,
            zoneCodeRequired: t.zone_code_required_error,
            durationRequired: t.duration_minutes_required_error,
            durationInvalid: t.duration_minutes_invalid_error,
            parkingServiceInvalid: t.parking_service_invalid_error,
          }),
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
                  label={
                    noPaymentRequired
                      ? t.status_no_payment_required
                      : statusLabels[detail.latestCheckout.status]
                  }
                  variant={noPaymentRequired ? 'info' : 'default'}
                />
              )
            : (
                <span className={`${RESPONSIVE.text.body} ${COLORS.text.secondary}`}>{t.no_checkout}</span>
              )}
        </div>
        {checkoutStatus === 'paid' && (
          <p className={`${RESPONSIVE.text.body} ${COLORS.feedback.success}`}>{t.paid_message}</p>
        )}
        {checkoutStatus === 'failed' && noPaymentRequired && (
          <p className={`${RESPONSIVE.text.body} text-amber-300`}>
            {t.no_payment_required_message}
          </p>
        )}
        {checkoutStatus === 'failed' && !noPaymentRequired && (
          <p className={`${RESPONSIVE.text.body} ${COLORS.feedback.error}`}>
            {detail.latestCheckout?.failureMessage ?? t.failed_message}
          </p>
        )}
        {showStillProcessingMessage && (
          <p className={`${RESPONSIVE.text.body} ${COLORS.text.secondary}`}>
            {t.pending_queued_message}
          </p>
        )}
        {checkoutAllowsPay && parkingServicesCatalog.services.length > 0 && (
          <>
            <div className="flex flex-col gap-2">
              <label htmlFor="parking-service" className={`${RESPONSIVE.text.body} ${COLORS.text.secondary}`}>
                {t.parking_service_label}
              </label>
              <select
                id="parking-service"
                name="parkingService"
                value={parkingServiceId}
                onChange={event => handleParkingServiceChange(event.target.value)}
                className={selectClassName}
              >
                {parkingServicesCatalog.services.map(service => (
                  <option key={service.id} value={service.id}>
                    {service.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="parking-duration" className={`${RESPONSIVE.text.body} ${COLORS.text.secondary}`}>
                {t.duration_label}
              </label>
              <select
                id="parking-duration"
                name="durationMinutes"
                value={durationMinutes == null ? '' : String(durationMinutes)}
                onChange={event => setDurationMinutes(Number.parseInt(event.target.value, 10))}
                className={selectClassName}
                disabled={!selectedCatalogEntry}
              >
                {(selectedCatalogEntry?.durationOptions ?? []).map(option => (
                  <option key={option.minutes} value={option.minutes}>
                    {durationLabelFromTranslations(option.minutes, t)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="parking-zone-code" className={`${RESPONSIVE.text.body} ${COLORS.text.secondary}`}>
                {t.zone_code_label}
              </label>
              <input
                id="parking-zone-code"
                name="zoneCode"
                type="text"
                inputMode="text"
                autoComplete="off"
                spellCheck={false}
                value={zoneCodeInput}
                onChange={event => setZoneCodeInput(event.target.value)}
                placeholder={t.zone_code_placeholder}
                maxLength={32}
                className={`${selectClassName} placeholder:text-text-secondary`}
              />
              <p className={`${RESPONSIVE.text.body} ${COLORS.text.secondary}`}>{zoneHint}</p>
            </div>
          </>
        )}
      </div>

      {showMissingPlateHint && (
        <p className={`${RESPONSIVE.text.body} ${COLORS.text.secondary}`}>{t.license_plate_missing_hint}</p>
      )}

      {showMissingDurationHint && (
        <p className={`${RESPONSIVE.text.body} ${COLORS.text.secondary}`}>{t.duration_missing_hint}</p>
      )}

      {showMissingZoneHint && (
        <p className={`${RESPONSIVE.text.body} ${COLORS.text.secondary}`}>{t.zone_code_missing_hint}</p>
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
