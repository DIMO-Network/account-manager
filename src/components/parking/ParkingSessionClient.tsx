'use client';

import type { ReactNode } from 'react';
import type { VehicleDefinitionSummary } from './parkingDisplayHelpers';
import type {
  ParkingAssistSessionDetail,
  ParkingCorporateCheckoutStatus,
  ParkingService,
  ParkingServicesCatalog,
  StartCorporateCheckoutResponse,
} from '@/types/parking-assist';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/ui';
import { Dropdown } from '@/components/ui/Dropdown';
import { useHydrated } from '@/hooks/useHydrated';
import { BORDER_RADIUS, COLORS, RESPONSIVE } from '@/utils/designSystem';
import { isNoPaymentRequiredCheckout } from '@/utils/parking-checkout';
import {
  findCatalogService,
  getMinimumDurationMinutes,
  getParkingDurationLabel,
  initialParkingCheckoutSelections,
  isDurationAllowedForCatalogService,
} from '@/utils/parking-services';
import { hasZoneCode, normalizeZoneCode } from '@/utils/zone-code';
import { ParkingCheckoutStatusIndicator } from './ParkingCheckoutStatusIndicator';
import { formatParkingSessionDateTime } from './parkingDateTime';
import {
  formatLicensePlateDisplay,
  formatSessionVehicleLine,
  getParkingCheckoutStatusDisplay,
  isCheckoutSummaryStatus,
  resolveCheckoutSummary,
} from './parkingDisplayHelpers';
import { ParkingSessionClientSkeleton } from './ParkingSessionClientSkeleton';

type ParkingSessionClientProps = {
  sessionId: string;
  initialDetail: ParkingAssistSessionDetail;
  parkingServicesCatalog: ParkingServicesCatalog;
  sessionTitle: string;
  sessionDescription: string;
  triggerLocation?: string;
  vehicleDefinition?: VehicleDefinitionSummary;
  translations: {
    vehicle_label: string;
    license_plate_not_set: string;
    license_plate_missing_hint: string;
    license_plate_required_error: string;
    parking_service_label: string;
    duration_label: string;
    duration_range_parkdetroit: string;
    duration_range_parkmobile: string;
    durationLabels: Record<string, string>;
    note_label: string;
    duration_missing_hint: string;
    duration_minutes_required_error: string;
    duration_minutes_invalid_error: string;
    parking_service_invalid_error: string;
    zone_code_label: string;
    zone_code_placeholder: string;
    zone_code_required_error: string;
    location_unknown: string;
    triggered_at_label: string;
    checkout_status_label: string;
    pay_for_parking: string;
    paying: string;
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
    pay_submitted_message: string;
    back_to_parking: string;
  };
  locale: string;
};

const POLL_INTERVAL_MS = 5000;
const PAY_SUBMITTED_MAX_POLL_ATTEMPTS = 6;
const MAX_POLL_ATTEMPTS_WITHOUT_PAY = 12;

const LABEL_STYLE = 'font-light text-xs leading-5 px-4 pt-3';
const VALUE_STYLE = 'font-medium text-base leading-5 px-4 pb-4 mt-1';
const FORM_FIELD_VALUE_STYLE = 'px-4 pb-3 mt-1';
const SECONDARY_VALUE_STYLE = 'text-xs text-text-secondary';
const BORDER_STYLE = 'border-b border-gray-700';
const INPUT_BASE_STYLE = `w-full h-10 box-border px-4 rounded-md border border-transparent bg-surface-raised text-base ${COLORS.text.primary} placeholder:text-base placeholder:text-text-secondary`;
const INPUT_ERROR_STYLE = 'border-feedback-error';

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

function durationRangeHintForService(
  serviceId: ParkingService | '',
  translations: Pick<ParkingSessionClientProps['translations'], 'duration_range_parkdetroit' | 'duration_range_parkmobile'>,
): string | null {
  if (serviceId === 'parkdetroit') {
    return translations.duration_range_parkdetroit;
  }
  if (serviceId === 'parkmobile') {
    return translations.duration_range_parkmobile;
  }
  return null;
}

function FieldRow({
  label,
  children,
  secondary,
  bordered = true,
  valueClassName = VALUE_STYLE,
}: {
  label: string;
  children: ReactNode;
  secondary?: ReactNode;
  bordered?: boolean;
  valueClassName?: string;
}) {
  return (
    <div>
      <div className={LABEL_STYLE}>{label}</div>
      <div className={`${valueClassName} ${bordered ? BORDER_STYLE : ''}`}>
        {children}
        {secondary != null && secondary !== ''
          ? (
              <p className={SECONDARY_VALUE_STYLE}>{secondary}</p>
            )
          : null}
      </div>
    </div>
  );
}

function resolveVehicleDefinition(
  serverDefinition: VehicleDefinitionSummary | undefined,
  detail: ParkingAssistSessionDetail,
): VehicleDefinitionSummary | undefined {
  const apiDef = detail.vehicleDefinition;
  if (apiDef?.make && apiDef?.model) {
    return { year: apiDef.year, make: apiDef.make, model: apiDef.model };
  }
  return serverDefinition;
}

export function ParkingSessionClient({
  sessionId,
  initialDetail,
  parkingServicesCatalog,
  sessionTitle,
  sessionDescription,
  triggerLocation,
  vehicleDefinition: serverVehicleDefinition,
  translations: t,
  locale,
}: ParkingSessionClientProps) {
  const router = useRouter();
  const hydrated = useHydrated();

  const initialSelections = useMemo(
    () =>
      initialParkingCheckoutSelections(
        parkingServicesCatalog,
        initialDetail.latestCheckout,
        initialDetail.suggestedParkingServiceId,
      ),
    [parkingServicesCatalog, initialDetail.latestCheckout, initialDetail.suggestedParkingServiceId],
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
  const [paySubmitted, setPaySubmitted] = useState(false);
  const [payAttempted, setPayAttempted] = useState(false);
  const [zoneCodeTouched, setZoneCodeTouched] = useState(false);

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
    const status = data.latestCheckout?.status;
    if (!isInProgress(status)) {
      setPaySubmitted(false);
      setPollingExhausted(false);
    }
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
  const showPaySubmittedMessage = paySubmitted && checkoutInProgress;

  const noteMessage = useMemo(() => {
    if (paying) {
      return t.paying;
    }
    if (checkoutInProgress) {
      return showPaySubmittedMessage ? t.pay_submitted_message : t.pending_queued_message;
    }
    return null;
  }, [paying, checkoutInProgress, showPaySubmittedMessage, t]);

  useEffect(() => {
    if (!checkoutInProgress || pollingExhausted) {
      return;
    }

    const maxAttempts = paySubmitted ? PAY_SUBMITTED_MAX_POLL_ATTEMPTS : MAX_POLL_ATTEMPTS_WITHOUT_PAY;

    void refreshSession();
    let attempts = 0;
    const id = window.setInterval(() => {
      attempts += 1;
      if (attempts >= maxAttempts) {
        window.clearInterval(id);
        setPollingExhausted(true);
        return;
      }
      void refreshSession();
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(id);
  }, [checkoutInProgress, pollingExhausted, paySubmitted, refreshSession]);

  const checkoutAllowsPay
    = !checkoutStatus || checkoutStatus === 'failed' || checkoutStatus === 'cancelled';

  const canPay
    = !paying
      && hasLicensePlate
      && hasValidParkingService
      && hasValidDuration
      && hasValidZoneCode
      && checkoutAllowsPay;

  const showPayForm = checkoutAllowsPay && parkingServicesCatalog.services.length > 0;

  const showZoneCodeError = showPayForm && (payAttempted || zoneCodeTouched) && !hasValidZoneCode;

  const parkingServiceOptions = useMemo(
    () => parkingServicesCatalog.services.map(service => ({
      label: service.label,
      value: service.id,
    })),
    [parkingServicesCatalog.services],
  );

  const durationOptions = useMemo(
    () => (selectedCatalogEntry?.durationOptions ?? []).map(option => ({
      label: getParkingDurationLabel(option.minutes, t.durationLabels),
      value: String(option.minutes),
    })),
    [selectedCatalogEntry, t.durationLabels],
  );

  const durationRangeHint = durationRangeHintForService(parkingServiceId, t);

  const checkout = detail.latestCheckout;
  const showPaidCheckoutSummary = checkoutStatus === 'paid';
  const showInProgressCheckoutSummary = checkoutStatus === 'pending' || checkoutStatus === 'running';

  const checkoutSummary = useMemo(() => {
    if (!checkout || !isCheckoutSummaryStatus(checkout.status)) {
      return null;
    }
    return resolveCheckoutSummary(checkout, parkingServicesCatalog, t.durationLabels);
  }, [checkout, parkingServicesCatalog, t.durationLabels]);

  const renderCheckoutSummaryFields = () => {
    if (!checkoutSummary) {
      return null;
    }
    return (
      <>
        <FieldRow label={t.parking_service_label}>
          {checkoutSummary.parkingServiceLabel}
        </FieldRow>
        {checkoutSummary.durationLabel && (
          <FieldRow label={t.duration_label}>
            {checkoutSummary.durationLabel}
          </FieldRow>
        )}
        {checkoutSummary.zoneDisplay && (
          <FieldRow label={t.zone_code_label}>
            {checkoutSummary.zoneDisplay}
          </FieldRow>
        )}
      </>
    );
  };

  const checkoutStatusDisplay = useMemo(() => {
    if (!detail.latestCheckout) {
      return getParkingCheckoutStatusDisplay(null, statusLabels, t.no_checkout);
    }
    if (noPaymentRequired) {
      return { text: t.status_no_payment_required, color: 'text-amber-300', indicatorColor: 'bg-amber-500' };
    }
    return getParkingCheckoutStatusDisplay(detail.latestCheckout.status, statusLabels, t.no_checkout);
  }, [detail.latestCheckout, noPaymentRequired, statusLabels, t]);

  const handleParkingServiceChange = (nextServiceId: string) => {
    setParkingServiceId(nextServiceId as ParkingService);
    const entry = findCatalogService(parkingServicesCatalog, nextServiceId as ParkingService);
    if (entry) {
      setDurationMinutes(getMinimumDurationMinutes(entry));
    }
  };

  const handlePay = async () => {
    setPayAttempted(true);
    setError(null);

    const zoneCode = normalizeZoneCode(zoneCodeInput);
    if (!zoneCode) {
      return;
    }
    if (!hasLicensePlate || !hasValidParkingService || !hasValidDuration) {
      return;
    }

    setPaying(true);
    try {
      const idempotencyKey = crypto.randomUUID();
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
      setPaySubmitted(true);
      setPollingExhausted(false);
      await refreshSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.pay_error);
    } finally {
      setPaying(false);
    }
  };

  const vehicleDefinition = useMemo(
    () => resolveVehicleDefinition(serverVehicleDefinition, detail),
    [serverVehicleDefinition, detail],
  );

  const vehicleLabel = formatSessionVehicleLine(vehicleDefinition, detail);

  const licensePlateDisplay = formatLicensePlateDisplay(
    vehicleLicensePlate,
    detail.vehicleState,
    t.license_plate_not_set,
  );

  const locationDisplay = triggerLocation ?? t.location_unknown;

  if (!hydrated) {
    return (
      <div className="flex flex-col gap-4 max-w-2xl">
        <ParkingSessionClientSkeleton />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <PageHeader
        icon={(
          <ParkingCheckoutStatusIndicator
            status={detail.latestCheckout?.status}
            statusLabels={statusLabels}
            noCheckoutLabel={t.no_checkout}
            className="h-2.5 w-2.5 shrink-0"
          />
        )}
        title={sessionTitle}
        className="mb-0"
      />
      <p className={`${COLORS.text.secondary} leading-relaxed ${RESPONSIVE.text.body}`}>
        {sessionDescription}
      </p>

      <div className="flex flex-col justify-between bg-surface-default rounded-2xl py-3">
        {error && (
          <div className={`mx-4 mb-4 mt-1 p-3 border border-feedback-error rounded-lg ${COLORS.background.secondary}`}>
            <p className="text-feedback-error text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-0">
          <FieldRow
            label={t.vehicle_label}
            secondary={(
              <span className={hasLicensePlate ? '' : COLORS.text.secondary}>
                {licensePlateDisplay}
              </span>
            )}
          >
            {vehicleLabel}
          </FieldRow>

          {showPaidCheckoutSummary && renderCheckoutSummaryFields()}

          <FieldRow label={t.triggered_at_label} secondary={locationDisplay}>
            {formatParkingSessionDateTime(detail.session.triggeredAt, locale)}
          </FieldRow>

          <FieldRow
            label={t.checkout_status_label}
            valueClassName={`${VALUE_STYLE} ${checkoutStatusDisplay.color}`}
          >
            {checkoutStatusDisplay.text}
          </FieldRow>

          {showInProgressCheckoutSummary && renderCheckoutSummaryFields()}

          {showPayForm && (
            <>
              <div>
                <div className={LABEL_STYLE}>{t.parking_service_label}</div>
                <div className={FORM_FIELD_VALUE_STYLE}>
                  <Dropdown
                    options={parkingServiceOptions}
                    value={parkingServiceId || undefined}
                    onChangeAction={handleParkingServiceChange}
                    showSearch={false}
                  />
                </div>
              </div>

              <div>
                <div className={LABEL_STYLE}>{t.duration_label}</div>
                {durationRangeHint && (
                  <p className={`px-4 pb-2 ${SECONDARY_VALUE_STYLE}`}>{durationRangeHint}</p>
                )}
                <div className={FORM_FIELD_VALUE_STYLE}>
                  <Dropdown
                    options={durationOptions}
                    value={durationMinutes == null ? undefined : String(durationMinutes)}
                    onChangeAction={value => setDurationMinutes(Number.parseInt(value, 10))}
                    disabled={!selectedCatalogEntry}
                    showSearch={false}
                  />
                </div>
              </div>

              <div>
                <div className={LABEL_STYLE}>{t.zone_code_label}</div>
                <div className={FORM_FIELD_VALUE_STYLE}>
                  <input
                    id="parking-zone-code"
                    name="zoneCode"
                    type="text"
                    inputMode="text"
                    autoComplete="off"
                    spellCheck={false}
                    required
                    value={zoneCodeInput}
                    onChange={(event) => {
                      setZoneCodeInput(event.target.value);
                      if (error) {
                        setError(null);
                      }
                    }}
                    onBlur={() => setZoneCodeTouched(true)}
                    placeholder={t.zone_code_placeholder}
                    maxLength={32}
                    className={`${INPUT_BASE_STYLE} ${showZoneCodeError ? INPUT_ERROR_STYLE : ''}`}
                  />
                  {showZoneCodeError && (
                    <p className="text-feedback-error text-sm mt-2">{t.zone_code_required_error}</p>
                  )}
                </div>
              </div>
            </>
          )}

          {noteMessage && (
            <div>
              <div className={LABEL_STYLE}>{t.note_label}</div>
              <div className="px-4 pb-4">
                <p className={`${RESPONSIVE.text.body} ${COLORS.text.secondary}`}>{noteMessage}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col mt-4 px-4 gap-2">
          {showPayForm && (
            <button
              type="button"
              onClick={() => void handlePay()}
              disabled={paying || !canPay}
              className={`${RESPONSIVE.touch} ${COLORS.button.secondary} ${BORDER_RADIUS.full} font-medium w-full mt-2 disabled:opacity-50`}
            >
              {paying ? t.paying : t.pay_for_parking}
            </button>
          )}
          <button
            type="button"
            onClick={() => router.push('/parking/')}
            className={`${RESPONSIVE.touch} ${BORDER_RADIUS.full} font-medium w-full ${COLORS.button.tertiary}`}
          >
            {t.back_to_parking}
          </button>
        </div>
      </div>
    </div>
  );
}
